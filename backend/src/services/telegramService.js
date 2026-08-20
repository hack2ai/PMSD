const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");
const crypto = require("crypto");

const TELEGRAM_API = "https://api.telegram.org";

const getBotToken = () => {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        const error = new Error("TELEGRAM_BOT_TOKEN is not configured.");
        error.status = 503;
        throw error;
    }
    return process.env.TELEGRAM_BOT_TOKEN;
};

const telegramCall = async (method, body = {}) => {
    const response = await fetch(`${TELEGRAM_API}/bot${getBotToken()}/${method}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
        const error = new Error(payload.description || `Telegram API ${method} failed.`);
        error.status = response.status >= 500 ? 502 : 400;
        throw error;
    }
    return payload.result;
};

const setWebhook = async ({ url, secretToken }) => telegramCall("setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["channel_post"]
});

const safeExtension = (name, telegramPath) => {
    const ext = path.extname(name || telegramPath || "").toLowerCase();
    return /^[a-z0-9.]{1,10}$/.test(ext) ? ext : ".bin";
};

const downloadTelegramFile = async ({ fileId, fileName }) => {
    const file = await telegramCall("getFile", { file_id: fileId });
    if (!file.file_path) throw new Error("Telegram did not return a file path.");

    const privateRoot = path.resolve(process.env.PRIVATE_MEDIA_ROOT || path.join(process.cwd(), "private-media"));
    const relativeKey = path.join("telegram", `${crypto.randomUUID()}${safeExtension(fileName, file.file_path)}`);
    const destination = path.resolve(privateRoot, relativeKey);
    if (!destination.startsWith(`${privateRoot}${path.sep}`)) throw new Error("Invalid private media destination.");

    await fs.promises.mkdir(path.dirname(destination), { recursive: true });
    const response = await fetch(`${TELEGRAM_API}/file/bot${getBotToken()}/${file.file_path}`);
    if (!response.ok || !response.body) throw new Error("Unable to download the Telegram media file.");

    const maxBytes = Number(process.env.MAX_PRIVATE_MEDIA_BYTES || 2 * 1024 * 1024 * 1024);
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > maxBytes) throw new Error("Lecture file exceeds the configured private media limit.");

    let totalBytes = 0;
    const source = Readable.fromWeb(response.body);
    const limiter = async function* () {
        for await (const chunk of source) {
            totalBytes += chunk.length;
            if (totalBytes > maxBytes) throw new Error("Lecture file exceeds the configured private media limit.");
            yield chunk;
        }
    };

    await pipeline(Readable.from(limiter()), fs.createWriteStream(destination, { flags: "wx" }));
    return {
        storageKey: relativeKey.split(path.sep).join("/"),
        sizeBytes: totalBytes,
        filePath: destination,
        telegramFilePath: file.file_path
    };
};

module.exports = { telegramCall, setWebhook, downloadTelegramFile };
