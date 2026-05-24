import React from "react";

export default function Base64ImageLoader({data, alt = "Image", className}){
    function setSrc(data){
        try{
            return data.startsWith('data:') ? data : `data:image/jpeg;base64,${data}`
        }
        catch (e){
            console.log("Error loading image: "+e)
            return null
        }
    }
    return (
        <img
            src={setSrc(data)}
            alt={alt}
            className={className}
        />
    )
}