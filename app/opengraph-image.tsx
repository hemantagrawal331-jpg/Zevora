import { ImageResponse } from "next/og";

export const alt = "ZEVORA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#171717",
          color: "#F8F7F4",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 10 }}>CLOTHING AND ACCESSORIES</div>
        <div style={{ fontSize: 92, letterSpacing: 16, marginTop: 24 }}>ZEVORA</div>
      </div>
    ),
    { ...size },
  );
}
