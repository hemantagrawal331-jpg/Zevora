import { images } from "@/lib/images";

export type Department = "men" | "women" | "accessories";

export type ProductColor = {
  name: string;
  hex: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  descriptor: string;
  department: Department;
  subcategory: string;
  price: number;
  compareAtPrice?: number;
  colors: ProductColor[];
  sizes: string[];
  image: string;
  imageAlt: string;
  imageFit: "cover" | "contain";
  isNew?: boolean;
  isBestseller?: boolean;
  description: string;
  details: string[];
};

const apparelSizes = ["XS", "S", "M", "L", "XL"];

export const departmentLabels: Record<Department, string> = {
  men: "Men",
  women: "Women",
  accessories: "Accessories",
};

export const subcategoryLabels: Record<string, string> = {
  outerwear: "Outerwear",
  knitwear: "Knitwear",
  dresses: "Dresses",
  tops: "Tops",
  bags: "Bags",
  jewelry: "Jewelry",
  sunglasses: "Sunglasses",
  scarves: "Scarves",
};

export const products: Product[] = [
  {
    id: "camel-wool-coat",
    slug: "camel-wool-coat",
    name: "Camel Wool Coat",
    descriptor: "Wool coat",
    department: "men",
    subcategory: "outerwear",
    price: 18900,
    colors: [
      { name: "Camel", hex: "#C4A574" },
      { name: "Black", hex: "#171717" },
      { name: "Charcoal", hex: "#4A4744" },
    ],
    sizes: apparelSizes,
    image: images.products.camelCoat,
    imageAlt:
      "Man seated against a plaster wall in an open camel overcoat, white t-shirt, and pale trousers.",
    imageFit: "cover",
    isNew: true,
    description:
      "A straight wool overcoat with a soft shoulder and a clean hem. Worn open, it sits easily over a tee or a shirt.",
    details: [
      "Wool blend with a dry handle",
      "Unlined through the body",
      "Photograph shows Camel",
    ],
  },
  {
    id: "forest-wool-jacket",
    slug: "forest-wool-jacket",
    name: "Forest Wool Jacket",
    descriptor: "Wool jacket",
    department: "men",
    subcategory: "outerwear",
    price: 16800,
    colors: [
      { name: "Forest", hex: "#1F3D32" },
      { name: "Navy", hex: "#1C2A44" },
      { name: "Charcoal", hex: "#4A4744" },
    ],
    sizes: apparelSizes,
    image: images.products.forestJacket,
    imageAlt:
      "Forest green wool jacket with a checked pocket square, worn over a navy shirt and dark tie.",
    imageFit: "cover",
    isNew: true,
    description:
      "A single-breasted wool jacket with a narrow lapel and a quiet shoulder. Cut to wear with the matching trouser or on its own.",
    details: [
      "Wool with a soft drape",
      "Single-breasted, one button",
      "Photograph shows Forest",
    ],
  },
  {
    id: "sky-wool-blazer",
    slug: "sky-wool-blazer",
    name: "Sky Wool Blazer",
    descriptor: "Wool blazer",
    department: "men",
    subcategory: "outerwear",
    price: 13900,
    colors: [
      { name: "Sky", hex: "#8FA4C4" },
      { name: "Navy", hex: "#1C2A44" },
      { name: "Ivory", hex: "#E7E1D6" },
    ],
    sizes: apparelSizes,
    image: images.products.skyBlazer,
    imageAlt: "Man walking in a light blue blazer, white shirt, and grey trousers.",
    imageFit: "cover",
    isNew: true,
    description:
      "An unstructured blazer in a mid-weight wool. The shoulder is soft enough for a warm afternoon and sharp enough for dinner.",
    details: ["Unstructured wool", "Patch pocket", "Photograph shows Sky"],
  },
  {
    id: "black-wool-blazer",
    slug: "black-wool-blazer",
    name: "Black Wool Blazer",
    descriptor: "Wool blazer",
    department: "men",
    subcategory: "outerwear",
    price: 14500,
    colors: [
      { name: "Black", hex: "#171717" },
      { name: "Charcoal", hex: "#4A4744" },
    ],
    sizes: apparelSizes,
    image: images.products.blackBlazer,
    imageAlt: "Man in a black wool blazer and black shirt, standing outdoors.",
    imageFit: "cover",
    isBestseller: true,
    description:
      "A black wool blazer with a slight sheen at the lapel. It is the piece that finishes a shirt, a knit, or nothing much at all.",
    details: ["Wool with a satin-faced lapel", "Two-button front", "Photograph shows Black"],
  },
  {
    id: "navy-tailored-jacket",
    slug: "navy-tailored-jacket",
    name: "Navy Tailored Jacket",
    descriptor: "Tailored jacket",
    department: "men",
    subcategory: "outerwear",
    price: 12400,
    compareAtPrice: 15800,
    colors: [
      { name: "Navy", hex: "#1C2A44" },
      { name: "Charcoal", hex: "#4A4744" },
    ],
    sizes: apparelSizes,
    image: images.products.navyJacket,
    imageAlt:
      "Close view of a navy tailored jacket being buttoned over a white shirt and striped tie.",
    imageFit: "cover",
    isBestseller: true,
    description:
      "A tailored navy jacket with a clean chest and a working button. On sale from the previous cut.",
    details: ["Wool suiting", "Working buttonholes", "Photograph shows Navy"],
  },
  {
    id: "cable-knit-vest",
    slug: "cable-knit-vest",
    name: "Cable Knit Vest",
    descriptor: "Knit vest",
    department: "men",
    subcategory: "knitwear",
    price: 4800,
    colors: [
      { name: "Ivory", hex: "#F3F0EA" },
      { name: "Navy", hex: "#1C2A44" },
      { name: "Camel", hex: "#C4A574" },
    ],
    sizes: apparelSizes,
    image: images.products.cableVest,
    imageAlt:
      "Man in a studio wearing a white cable-knit vest with striped trim and wide khaki trousers.",
    imageFit: "cover",
    isNew: true,
    description:
      "A cable-knit vest with a deep rib and a tipped neckline. Layer it over a shirt, or wear it on its own.",
    details: ["Cotton-wool cable knit", "Ribbed hem and neck", "Photograph shows Ivory"],
  },
  {
    id: "belted-camel-coat",
    slug: "belted-camel-coat",
    name: "Belted Camel Coat",
    descriptor: "Wool coat",
    department: "women",
    subcategory: "outerwear",
    price: 21400,
    colors: [
      { name: "Camel", hex: "#C4A574" },
      { name: "Black", hex: "#171717" },
      { name: "Stone", hex: "#B7B1A6" },
    ],
    sizes: apparelSizes,
    image: images.products.beltedCoat,
    imageAlt:
      "Woman on stone steps wearing a belted camel wrap coat over black trousers.",
    imageFit: "cover",
    isBestseller: true,
    description:
      "A wrap coat in camel wool, belted at the waist with a long tie. The shoulder is set, the hem is long, and it needs very little else.",
    details: ["Wool wrap coat", "Self-belt", "Photograph shows Camel"],
  },
  {
    id: "windowpane-wool-coat",
    slug: "windowpane-wool-coat",
    name: "Windowpane Wool Coat",
    descriptor: "Wool coat",
    department: "women",
    subcategory: "outerwear",
    price: 19600,
    colors: [
      { name: "Ink check", hex: "#1A2A33" },
      { name: "Camel", hex: "#C4A574" },
      { name: "Black", hex: "#171717" },
    ],
    sizes: apparelSizes,
    image: images.products.windowpaneCoat,
    imageAlt:
      "Woman on a city pavement wearing a dark windowpane overcoat and carrying a woven bag.",
    imageFit: "cover",
    isNew: true,
    description:
      "A straight overcoat in a dark windowpane wool. The check is quiet from a distance and precise up close.",
    details: ["Wool windowpane", "Knee length", "Photograph shows Ink check"],
  },
  {
    id: "sheer-silk-blouse",
    slug: "sheer-silk-blouse",
    name: "Sheer Silk Blouse",
    descriptor: "Silk blouse",
    department: "women",
    subcategory: "tops",
    price: 6200,
    colors: [
      { name: "Black", hex: "#171717" },
      { name: "Ivory", hex: "#F3F0EA" },
    ],
    sizes: apparelSizes,
    image: images.products.sheerBlouse,
    imageAlt: "Studio portrait of a woman wearing a black sheer short-sleeve blouse.",
    imageFit: "cover",
    isNew: true,
    description:
      "A short-sleeve blouse in sheer silk with a scalloped facing. Wear it over a slip or a fine knit.",
    details: ["Sheer silk", "Scalloped facing", "Photograph shows Black"],
  },
  {
    id: "broderie-cotton-dress",
    slug: "broderie-cotton-dress",
    name: "Broderie Cotton Dress",
    descriptor: "Cotton dress",
    department: "women",
    subcategory: "dresses",
    price: 7400,
    colors: [
      { name: "White", hex: "#F7F7F5" },
      { name: "Black", hex: "#171717" },
    ],
    sizes: apparelSizes,
    image: images.products.broderieDress,
    imageAlt: "Woman on outdoor stairs wearing a white off-shoulder broderie dress.",
    imageFit: "cover",
    isNew: true,
    description:
      "An off-shoulder cotton dress with broderie anglaise and a shirred waist. Light, and a little dressed.",
    details: ["Cotton broderie", "Shirred waist", "Photograph shows White"],
  },
  {
    id: "floral-wrap-dress",
    slug: "floral-wrap-dress",
    name: "Floral Wrap Dress",
    descriptor: "Wrap dress",
    department: "women",
    subcategory: "dresses",
    price: 6800,
    compareAtPrice: 8900,
    colors: [
      { name: "Cream floral", hex: "#E7D7C8" },
      { name: "Black", hex: "#171717" },
    ],
    sizes: apparelSizes,
    image: images.products.floralDress,
    imageAlt:
      "Close view of a cream floral wrap dress with a tie waist, worn beside the water.",
    imageFit: "cover",
    description:
      "A wrap dress in a small floral print on cream. The tie sits at the waist and the skirt moves.",
    details: ["Viscose twill", "True wrap with tie", "Photograph shows Cream floral"],
  },
  {
    id: "chevron-knit",
    slug: "chevron-knit",
    name: "Chevron Knit",
    descriptor: "Wool knit",
    department: "women",
    subcategory: "knitwear",
    price: 5400,
    colors: [
      { name: "Camel", hex: "#C4A574" },
      { name: "Ivory", hex: "#F3F0EA" },
      { name: "Black", hex: "#171717" },
    ],
    sizes: apparelSizes,
    image: images.products.chevronKnit,
    imageAlt:
      "Woman standing on rocks in a camel and white chevron knit and pale shorts.",
    imageFit: "cover",
    isBestseller: true,
    description:
      "A cropped knit with a bold chevron in camel and ivory. The gauge is firm, so it holds its shape.",
    details: ["Wool-cotton knit", "Ribbed cuffs and hem", "Photograph shows Camel"],
  },
  {
    id: "tan-leather-tote",
    slug: "tan-leather-tote",
    name: "Tan Leather Tote",
    descriptor: "Leather tote",
    department: "accessories",
    subcategory: "bags",
    price: 9800,
    colors: [
      { name: "Tan", hex: "#A56B3C" },
      { name: "Black", hex: "#171717" },
    ],
    sizes: [],
    image: images.products.leatherTote,
    imageAlt: "Unstructured tan leather tote with rolled handles.",
    imageFit: "cover",
    isBestseller: true,
    description:
      "An unstructured leather tote with a soft base and rolled handles. It holds a day without looking like luggage.",
    details: ["Full-grain leather", "Unlined", "Photograph shows Tan"],
  },
  {
    id: "round-metal-sunglasses",
    slug: "round-metal-sunglasses",
    name: "Round Metal Sunglasses",
    descriptor: "Sunglasses",
    department: "accessories",
    subcategory: "sunglasses",
    price: 4200,
    colors: [
      { name: "Gold", hex: "#C6A15B" },
      { name: "Black", hex: "#171717" },
    ],
    sizes: [],
    image: images.products.sunglasses,
    imageAlt: "Round gold-framed sunglasses with dark green lenses on white marble.",
    imageFit: "contain",
    isNew: true,
    description:
      "A round metal frame with dark lenses. Light on the face, and straightforward to wear every day.",
    details: ["Metal frame", "Dark lenses", "Photograph shows Gold"],
  },
  {
    id: "crescent-pendant",
    slug: "crescent-pendant",
    name: "Crescent Pendant",
    descriptor: "Gold necklace",
    department: "accessories",
    subcategory: "jewelry",
    price: 3200,
    colors: [
      { name: "Gold", hex: "#C6A15B" },
      { name: "Silver", hex: "#C5C5C5" },
    ],
    sizes: [],
    image: images.products.crescentNecklace,
    imageAlt: "Gold necklaces with a blue stone and a crescent pendant set with small stones.",
    imageFit: "cover",
    isBestseller: true,
    description:
      "A fine gold chain with a crescent pendant. It sits at the collarbone and layers cleanly with a second chain.",
    details: ["Gold-tone metal", "Adjustable chain", "Photograph shows Gold"],
  },
  {
    id: "pearl-strand",
    slug: "pearl-strand",
    name: "Pearl Strand",
    descriptor: "Pearl necklace",
    department: "accessories",
    subcategory: "jewelry",
    price: 5600,
    compareAtPrice: 7200,
    colors: [{ name: "Pearl", hex: "#F4EFE6" }],
    sizes: [],
    image: images.products.pearlStrand,
    imageAlt: "A strand of pearls with a floral clasp, resting in an open jewellery box.",
    imageFit: "contain",
    description:
      "A single strand of pearls with a small floral clasp. Quiet enough for a shirt, complete enough on its own.",
    details: ["Glass pearls", "Floral clasp", "Photograph shows Pearl"],
  },
  {
    id: "ivory-knit-wrap",
    slug: "ivory-knit-wrap",
    name: "Ivory Knit Wrap",
    descriptor: "Knit wrap",
    department: "accessories",
    subcategory: "scarves",
    price: 2800,
    colors: [
      { name: "Ivory", hex: "#F3EFE6" },
      { name: "Camel", hex: "#C4A574" },
      { name: "Black", hex: "#171717" },
    ],
    sizes: [],
    image: images.products.knitWrap,
    imageAlt: "Ivory open-knit wrap with fringe, hanging on a wooden hanger.",
    imageFit: "cover",
    isNew: true,
    description:
      "An open-knit wrap with a fringe edge. Throw it over a coat or wear it as a light layer.",
    details: ["Cotton open knit", "Fringed edge", "Photograph shows Ivory"],
  },
];
