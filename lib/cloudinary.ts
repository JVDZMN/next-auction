export function cloudinaryBlurUrl(src: string): string {
  return src.replace('/upload/', '/upload/w_20,h_20,c_fill,q_5,e_blur:500,f_webp/')
}

export function cloudinaryCardUrl(src: string, width = 400): string {
  return src.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`)
}
