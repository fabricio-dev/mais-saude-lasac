import { Epilogue } from "next/font/google";

const epilogue = Epilogue({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AutoCreatePatient() {
  return <div className={epilogue.className}>AutoCreatePatient</div>;
}
