import carBrandsData from '@/data/car-brands.json'

interface CarModel {
  model: string
  sub_models: string[]
}

interface CarBrand {
  brand: string
  models: CarModel[]
}

const brands = carBrandsData.brands as CarBrand[]

export function getAllBrands(): string[] {
  return brands.map(b => b.brand)
}

export function getModelsByBrand(brandName: string): string[] {
  const brand = brands.find(b => b.brand === brandName)
  return brand?.models.map(m => m.model) ?? []
}

export function getSubModelsByBrandModel(brandName: string, modelName: string): string[] {
  const brand = brands.find(b => b.brand === brandName)
  const model = brand?.models.find(m => m.model === modelName)
  return model?.sub_models ?? []
}
