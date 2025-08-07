import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("upload", "routes/upload.ts"),
  route("upload/:uploadId", "routes/upload.ts"),
];
