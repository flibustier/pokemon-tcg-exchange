for f in public/images/cards/*.webp; do 
    filename="$(basename "$f")"; 
    magick "$f" -interlace plane -strip -quality 85 -resize 208x290 -sharpen 0x0.5 "public/images/cards/thumbnails/$filename"; 
done