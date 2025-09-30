import React from 'react'
import Image from 'next/image'

const AlbumLogo = () => {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="relative w-96 h-96 overflow-hidden bg-gradient-to-r from-stone-950  to-black">
          {/* Background Image */}

          {/* Gray Overlay with Circular Cutout */}
          <div className="absolute w-full overflow-hidden top-0 -right-[190px] h-full bg-white ">
            {/* Circular cutout */}
            <Image
              src="/assets/elivagar.webp"
              alt="Album Cover"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover absolute p-10"
            />
            {/* Border overlay for smooth transition */}
            <div className="absolute inset-0">
              <Image
                src="/assets/border.png"
                alt="Border"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover drop-shadow-2xl"
                style={{
                  filter:
                    "drop-shadow(0 15px 15px rgba(0, 0, 0, 0.4)) drop-shadow(0 10px 5px rgba(0, 0, 0, 0.5))",
                }}
              />
            </div>
          </div>

          <div className="absolute -top-5  w-44 h-44 -left-12 s">
            <Image
              src="/assets/raven.png"
              alt="Album Cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              fill
              className="object-cover absolute p-10 w-full h-full"
            />
          </div>

          {/* Text Content */}
          <div className="absolute bottom-4 left-4 text-white z-10">
            <h2 className="text-2xl font-bold leading-none">ELIVAGAR</h2>
            <p className="text-sm font-normal secondary text-gold">
              Essence Radio 001
            </p>
          </div>
        </div>
      </div>
    );
}

export default AlbumLogo