export async function uploadTikTokVideo(accessToken: string, videoBuffer: Buffer, title: string) {
  // TikTok requiere primero "iniciar" la subida para obtener una URL de subida
  // Para simplificar, usaremos el Direct Post si tienes el permiso 'video.publish'
  const cleanTitle = title ? title.slice(0, 150) : "Nuevo Clip";
  const videoSize = Math.floor(videoBuffer.byteLength);

  const response = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/video/init/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          caption: cleanTitle,
          privacy_level: "SELF_ONLY",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: "FILE_UPLOAD",
        },
        video_info: {
          video_size: videoSize,
          chunk_number: 1,
          total_chunk_number: 1,
        },
      }),
    }
  );


  const data = await response.json();
  if (!response.ok) {
    console.error("TikTok Upload Init Failed, token:", accessToken);
    console.error("TikTok Response Status:", response.status);
    console.error("TikTok Full Error:", JSON.stringify(data, null, 2));

    if (data.error?.code === "invalid_params") {
      throw new Error("TikTok rechaza los parámetros. Verifica que tu App tenga 'Direct Post' activado en el panel de desarrollador.");
    }
    throw new Error(data.error?.message || "Error en Init");
  }

  const uploadUrl = data.data.upload_url;

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": videoSize.toString(), // Forzamos el header
    },
    body: new Uint8Array(videoBuffer),
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    console.error("Binary Upload Error:", errorText);
    throw new Error("Failed to upload binary to TikTok");
  }

  return data.data;
}