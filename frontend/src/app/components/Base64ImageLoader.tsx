import React from "react";

export default function Base64ImageLoader({data, alt = "Image", className}){
    return (
        <img
            src={data.startsWith('data:') ? data : `data:image/jpeg;base64,${data}`}
            alt={alt}
            className={className}
        />
    )
}