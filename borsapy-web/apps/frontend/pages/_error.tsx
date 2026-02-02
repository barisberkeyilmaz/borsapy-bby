import { NextPageContext } from "next";

interface ErrorProps {
  statusCode?: number;
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: "1rem",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <h1 style={{ fontSize: "3rem", fontWeight: "bold", margin: 0 }}>
        {statusCode || "Hata"}
      </h1>
      <p style={{ color: "#666", margin: 0 }}>
        {statusCode === 404
          ? "Sayfa bulunamadi"
          : statusCode === 500
          ? "Sunucu hatasi"
          : "Bir hata olustu"}
      </p>
      <a href="/" style={{ color: "#0070f3", textDecoration: "underline" }}>
        Ana sayfaya don
      </a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
