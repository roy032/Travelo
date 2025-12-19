/**
 * Wikimedia Commons API utilities
 * Documentation: https://www.mediawiki.org/wiki/API:Main_page
 *
 * Fetches images from Wikimedia Commons using category-based search
 */

const WIKIMEDIA_API_BASE = "https://commons.wikimedia.org/w/api.php";

/**
 * Fetch images from Wikimedia Commons for a given place/category name
 * Uses the categorymembers generator to find images in a category
 *
 * @param {string} categoryName - Name of the place/category to search for
 * @param {number} limit - Maximum number of images to fetch (default: 10)
 * @returns {Promise<Array>} Array of image URL strings
 */
export async function fetchWikimediaImages(categoryName, limit = 10) {
  const placeholderImages = [
    "https://cdn.dhakapost.com/media/imgAll/BG/2021October/tanguar-20211017170319.jpg",
    "https://bdscenictours.b-cdn.net/wp-content/uploads/2023/08/Edit2.jpg",
    "https://www.gokitetours.com/wp-content/uploads/2024/07/Top-10-Tourist-Places-to-Visit-in-Bangladesh.webp",
    "https://res.cloudinary.com/tourhq/image/upload/c_fill,f_auto,fl_progressive,g_auto,h_900,q_auto:best,w_1800/bnullainqkzvawlu0c8e",
    "https://www.tbsnews.net/sites/default/files/styles/big_3/public/images/2020/09/27/sajek_valley_d.jpg",
    "https://nijhoom.b-cdn.net/wp-content/uploads/2019/07/through-the-tea-plantations-III-600-o.jpg",
    "https://blog.flyticket.com.bd/wp-content/uploads/2020/05/image003.jpg",
    "https://www.gokitetours.com/wp-content/uploads/2024/07/6.-Sylhet-.webp",
    "https://media1.thrillophilia.com/filestore/6ytlq8eswu1glft0hgp7g8ahzdb0_DQo9UJ9XkAEma2Z.jpg_large?w=753&h=450&dpr=2.0",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjdBp7Z9m1P7VDPlDWtwYG5VYATIPCbsoWNg&s",
  ];
  try {
    if (!categoryName || typeof categoryName !== "string") {
      throw new Error("Invalid category name");
    }

    const url =
      `${WIKIMEDIA_API_BASE}?action=query` +
      `&format=json` +
      `&generator=categorymembers` +
      `&gcmtitle=Category:${encodeURIComponent(categoryName)}` +
      `&gcmtype=file` +
      `&gcmlimit=${limit}` +
      `&prop=imageinfo` +
      `&iiprop=url` +
      `&origin=*`; // Required for CORS

    const response = await fetch(url);

    if (!response.ok) {
      return placeholderImages;
    }

    const data = await response.json();
    console.log("Wikimedia API response for", categoryName, ":", data);

    if (!data.query || !data.query.pages) {
      console.warn("No images found for category:", categoryName);
      return placeholderImages; // No images found
    }

    const pages = Object.values(data.query.pages);

    // Extract actual image URLs and decode them properly
    const images = pages
      .map((p) => {
        const url = p.imageinfo?.[0]?.url;
        // Decode the URL to fix double-encoded characters like %28 -> (
        return url ? decodeURIComponent(url) : null;
      })
      .filter(Boolean); // Remove null/undefined
    console.log("Extracted image URLs:", images);

    return images;
  } catch (error) {
    console.error("Error fetching Wikimedia images:", error);
    return placeholderImages;
  }
}
