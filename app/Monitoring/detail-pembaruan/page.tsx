import DetailPresentasePembaruan from "../_components-ilaspp/revisi-detail-pembaruan";

export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <main className="w-full min-w-0 max-w-full overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-[1700px]">
        <DetailPresentasePembaruan />
      </div>
    </main>
  );
}
