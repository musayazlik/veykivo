type HomepageImage = { url: string; altText: string };

// Yalnızca örnek kapakları değiştirir; panelden yüklenen görseller korunur.
export const homepageImages: Record<string, HomepageImage | undefined> = {
  "/images/projects/lojistik.jpg": {
    url: "/images/home/fleet-platform.webp",
    altText: "Filo takip haritası ve sevkiyat panelini gösteren masaüstü ekranı ile tablet",
  },
  "/images/projects/uretim.jpg": {
    url: "/images/home/manufacturing-erp.webp",
    altText: "Üretim planlama ve stok yönetimi ekranlarını gösteren dizüstü bilgisayar ile tablet",
  },
  "/images/blog/karar.jpg": {
    url: "/images/home/custom-software.webp",
    altText: "Hazır paket ve özel yazılımı temsil eden düzenli küpler ile modüler cam yapı",
  },
  "/images/blog/erp.jpg": {
    url: "/images/home/erp-planning.webp",
    altText: "ERP hazırlığı için süreç kartları, üretim takvimi ve planlama defteri",
  },
  "/images/blog/yapay-zeka.jpg": {
    url: "/images/home/ai-workflows.webp",
    altText: "Belge ve veri modüllerini birbirine bağlayan cam yapay zekâ küpü",
  },
};
