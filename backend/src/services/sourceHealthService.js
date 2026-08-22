const dns = require("dns").promises;
const http = require("http");
const https = require("https");
const net = require("net");
const lectureSourceModel = require("../models/lectureSourceModel");

const REQUEST_TIMEOUT_MS = Number(process.env.SOURCE_HEALTH_TIMEOUT_MS) || 5000;

const isPrivateIpv4 = (ip) => {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 100 && b >= 64 && b <= 127);
};

const isPrivateIpv6 = (ip) => {
    const normalized = ip.toLowerCase();
    return normalized === "::1" ||
        normalized.startsWith("fc") ||
        normalized.startsWith("fd") ||
        normalized.startsWith("fe80:") ||
        normalized.startsWith("::ffff:127.") ||
        normalized.startsWith("::ffff:10.") ||
        normalized.startsWith("::ffff:192.168.") ||
        normalized.startsWith("::ffff:172.16.");
};

const isPublicIp = (ip) => {
    const family = net.isIP(ip);
    if (family === 4) return !isPrivateIpv4(ip);
    if (family === 6) return !isPrivateIpv6(ip);
    return false;
};

const resolvePublicAddress = async (hostname) => {
    if (net.isIP(hostname)) {
        if (!isPublicIp(hostname)) throw new Error("SOURCE_HOST_NOT_PUBLIC");
        return { address: hostname, family: net.isIP(hostname) };
    }

    const records = await dns.lookup(hostname, { all: true, verbatim: true });
    const publicRecord = records.find((record) => isPublicIp(record.address));
    if (!publicRecord) throw new Error("SOURCE_HOST_NOT_PUBLIC");
    return publicRecord;
};

const checkSource = (urlValue) => new Promise(async (resolve) => {
    let target;
    try {
        target = new URL(urlValue);
        if (!["http:", "https:"].includes(target.protocol)) {
            return resolve({ status: "UNKNOWN", httpStatus: null, reason: "UNSUPPORTED_PROTOCOL" });
        }
        const address = await resolvePublicAddress(target.hostname);
        const client = target.protocol === "https:" ? https : http;
        const request = client.request({
            protocol: target.protocol,
            hostname: address.address,
            port: target.port || undefined,
            path: `${target.pathname || "/"}${target.search || ""}`,
            method: "HEAD",
            timeout: REQUEST_TIMEOUT_MS,
            headers: {
                Host: target.host,
                "User-Agent": "PMSD-Source-Health/1.0"
            },
            servername: target.hostname,
            lookup: (_hostname, _options, callback) => callback(null, address.address, address.family)
        }, (response) => {
            response.resume();
            const code = response.statusCode || 0;
            if (code >= 200 && code < 300) return resolve({ status: "AVAILABLE", httpStatus: code, reason: "SOURCE_RESPONDED" });
            if (code === 401 || code === 403) return resolve({ status: "REQUIRES_AUTH", httpStatus: code, reason: "SOURCE_REQUIRES_AUTH" });
            if (code >= 300 && code < 400) return resolve({ status: "MOVED", httpStatus: code, reason: "SOURCE_REDIRECTS" });
            if (code === 429 || code >= 500) return resolve({ status: "TEMPORARILY_UNAVAILABLE", httpStatus: code, reason: "SOURCE_UNAVAILABLE" });
            return resolve({ status: "UNKNOWN", httpStatus: code, reason: "UNEXPECTED_HTTP_STATUS" });
        });

        request.on("timeout", () => {
            request.destroy();
            resolve({ status: "TEMPORARILY_UNAVAILABLE", httpStatus: null, reason: "SOURCE_CHECK_TIMEOUT" });
        });
        request.on("error", (error) => {
            resolve({ status: "TEMPORARILY_UNAVAILABLE", httpStatus: null, reason: error.code || "SOURCE_CHECK_FAILED" });
        });
        request.end();
    } catch (error) {
        resolve({ status: "UNKNOWN", httpStatus: null, reason: error.message || "SOURCE_CHECK_FAILED" });
    }
});

const checkAndPersistSource = async (sourceId) => {
    const source = await lectureSourceModel.getSourceById(sourceId);
    if (!source) return null;

    const result = await checkSource(source.source_url);
    const updated = await lectureSourceModel.updateSourceStatus(sourceId, result.status, result.httpStatus);

    return {
        source: updated,
        health: result
    };
};

module.exports = {
    checkAndPersistSource
};
