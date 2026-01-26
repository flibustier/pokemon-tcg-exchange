for f in public/images/cards-by-set/*/*.webp; do 
    filename="$(basename "$f")"; 
    # only last directory
    directory="$(basename "$(dirname "$f")")"; 
    mkdir -p "public/images/cards-by-set/thumbnails/$directory"; 
    magick "$f" -interlace plane -strip -quality 85 -resize 208x290 -sharpen 0x0.5 "public/images/cards-by-set/thumbnails/$directory/$filename"; 
done