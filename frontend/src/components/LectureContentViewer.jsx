import { FiExternalLink, FiFileText, FiLock, FiPlayCircle } from "react-icons/fi";

const getSourceType = (access, lecture) =>
    access?.source?.sourceType || lecture?.lecture_type || "EXTERNAL";

function LectureContentViewer({ lecture, access }) {
    if (!access) {
        return (
            <div className="content-state">
                <FiLock size={30} />
                <h2>Content locked</h2>
                <p>Check access to load the approved lecture destination.</p>
            </div>
        );
    }

    if (!access.success) {
        return (
            <div className="content-state content-error">
                <FiLock size={30} />
                <h2>Lecture unavailable</h2>
                <p>{access.message || "PMSD could not find an approved lecture source."}</p>
            </div>
        );
    }

    if (access.access === "REQUIRES_AUTH") {
        return (
            <div className="content-state">
                <FiLock size={30} />
                <h2>Institutional authentication required</h2>
                <p>{access.message || "Open the approved source using your authorized institutional session."}</p>
            </div>
        );
    }

    const url = access.source?.url;
    if (!url) {
        return (
            <div className="content-state content-error">
                <FiLock size={30} />
                <h2>No destination returned</h2>
                <p>The source was selected, but no destination was provided.</p>
            </div>
        );
    }

    const sourceType = getSourceType(access, lecture);
    const lowerUrl = url.toLowerCase();

    if (sourceType === "PMSD_HOSTED" && lecture?.lecture_type === "VIDEO") {
        return (
            <div className="content-viewer">
                <video
                    className="lecture-video"
                    controls
                    preload="metadata"
                    src={url}
                    controlsList="nodownload"
                />
            </div>
        );
    }

    if (sourceType === "PMSD_HOSTED" && lecture?.lecture_type === "PDF") {
        return (
            <div className="content-viewer document-viewer">
                <iframe title={lecture.title || "Lecture PDF"} src={url} />
            </div>
        );
    }

    if (lowerUrl.endsWith(".pdf") && lecture?.lecture_type === "PDF") {
        return (
            <div className="content-state">
                <FiFileText size={30} />
                <h2>Approved PDF resource</h2>
                <p>Open the approved document in a new tab.</p>
                <a href={url} target="_blank" rel="noreferrer" className="open-lecture">
                    Open PDF <FiExternalLink />
                </a>
            </div>
        );
    }

    return (
        <div className="content-state">
            <FiPlayCircle size={30} />
            <h2>Approved external lecture</h2>
            <p>The access engine approved this source. Open it in a separate tab to preserve the source's own authentication/session behavior.</p>
            <a href={url} target="_blank" rel="noreferrer" className="open-lecture">
                Open Lecture <FiExternalLink />
            </a>
        </div>
    );
}

export default LectureContentViewer;
