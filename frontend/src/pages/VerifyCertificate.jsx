import { useParams } from "react-router-dom";

function VerifyCertificate() {
    const { certificateNumber } = useParams();

    return (
        <h1>
            Verify Certificate: {certificateNumber}
        </h1>
    );
}

export default VerifyCertificate;