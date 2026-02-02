import { NextPage } from "next";

interface ErrorProps {
  statusCode?: number;
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      fontFamily: "sans-serif"
    }}>
      <h1 style={{ fontSize: "4rem", margin: 0 }}>
        {statusCode || "Error"}
      </h1>
      <p style={{ color: "#666" }}>
        {statusCode === 404
          ? "Sayfa bulunamadı"
          : "Bir hata oluştu"}
      </p>
    </div>
  );
};

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
