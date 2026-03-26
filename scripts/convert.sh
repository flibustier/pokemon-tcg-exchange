for f in public/images/cards-by-set/*/*.webp; do 
    filename="$(basename "$f")"; 
    directory="$(basename "$(dirname "$f")")"; 
    thumbnail_path="public/images/cards-by-set/thumbnails/$directory/$filename"
    
    if [[ "$*" == *"-f"* ]] || [[ ! -f "$thumbnail_path" ]]; then
        mkdir -p "public/images/cards-by-set/thumbnails/$directory"; 
        magick "$f" -interlace plane -strip -quality 85 -resize 208x290 -sharpen 0x0.5 "$thumbnail_path"; 
    fi
done