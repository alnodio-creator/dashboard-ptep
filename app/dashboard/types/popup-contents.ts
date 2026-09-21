import { ZntProperties } from "@/constants/auth-constants";

export const getPopupContent = (props: ZntProperties) => {
  const nilai = props.nilai
    ? `Rp ${Number(props.nilai).toLocaleString("id-ID")}`
    : "-";

  const validSejak = props.validsejak
    ? new Date(props.validsejak).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "-";

  const validSampai = props.validsampai
    ? new Date(props.validsampai).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Tidak ada batas";

  return `
    <div style="
      font-family: sans-serif;
      font-size: 12px;
      padding: 10px;
      min-width: 280px;
      color: #1f2937;
    ">

      <div style="
        font-size: 14px;
        font-weight: 700;
        color: #111827;
        margin-bottom: 8px;
      ">
        Detail Zona Nilai Tanah
      </div>

      <table style="
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        overflow: hidden;
      ">

        <tr>
          <td style="
            padding: 7px 8px;
            width: 100px;
            background: #f9fafb;
            color: #6b7280;
            font-weight: 600;
            border-bottom: 1px solid #e5e7eb;
          ">
            Nomor Zona
          </td>

          <td style="
            padding: 7px 8px;
            color: #111827;
            font-weight: 600;
            border-bottom: 1px solid #e5e7eb;
          ">
            ${props.nomorzone || "-"}
          </td>
        </tr>

        <tr>
          <td style="
            padding: 7px 8px;
            background: #f9fafb;
            color: #6b7280;
            font-weight: 600;
            border-bottom: 1px solid #e5e7eb;
          ">
            Nilai
          </td>

          <td style="
            padding: 7px 8px;
            color: #166534;
            font-weight: 700;
            border-bottom: 1px solid #e5e7eb;
          ">
            ${nilai}
          </td>
        </tr>

        <tr>
          <td style="
            padding: 7px 8px;
            background: #f9fafb;
            color: #6b7280;
            font-weight: 600;
            border-bottom: 1px solid #e5e7eb;
          ">
            Kelas
          </td>

          <td style="
            padding: 7px 8px;
            color: #111827;
            font-weight: 600;
            border-bottom: 1px solid #e5e7eb;
          ">
            ${props.kelas || "-"}
          </td>
        </tr>

        <tr>
          <td style="
            padding: 7px 8px;
            background: #f9fafb;
            color: #6b7280;
            font-weight: 600;
            border-bottom: 1px solid #e5e7eb;
          ">
            No. SK
          </td>

          <td style="
            padding: 7px 8px;
            color: #111827;
            line-height: 1.4;
            border-bottom: 1px solid #e5e7eb;
          ">
            ${props.nomorsk || "-"}
          </td>
        </tr>

        <tr>
          <td style="
            padding: 7px 8px;
            background: #f9fafb;
            color: #6b7280;
            font-weight: 600;
            border-bottom: 1px solid #e5e7eb;
          ">
            Berlaku Sejak
          </td>

          <td style="
            padding: 7px 8px;
            color: #111827;
            border-bottom: 1px solid #e5e7eb;
          ">
            ${validSejak}
          </td>
        </tr>

        <tr>
          <td style="
            padding: 7px 8px;
            background: #f9fafb;
            color: #6b7280;
            font-weight: 600;
          ">
            Berlaku Sampai
          </td>

          <td style="
            padding: 7px 8px;
            color: #111827;
          ">
            ${validSampai}
          </td>
        </tr>

      </table>
    </div>
  `;
};
