import HomePage from "@/components/commons/landing-page";
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/Monitoring/monitoring-berkas");
  // return (
  //   <div>
  //     {/* <HomePage /> */}
  //   </div>
  // );
}
