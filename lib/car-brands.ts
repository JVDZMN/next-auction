import carBrandsData from '@/data/car-brands.json'

export function getAllBrands(): string[] {
  return carBrandsData.brands.map(brand => brand.brand)
}

export function getModelsByBrand(brandName: string): string[] {
  const brand = carBrandsData.brands.find(b => b.brand === brandName)
  return brand?.models || []
}
