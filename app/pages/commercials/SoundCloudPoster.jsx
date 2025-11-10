import { Michroma } from 'next/font/google'


const michroma = Michroma({
  weight: '400',
  subsets: ['latin'],
})

const SoundCloudPoster = () => {
  return (
     <div className='h-screen w-full center z-10'>
       <div className='w-98 h-98 relative bg-stone-950'>
          <h1 className={`font-bold  absolute bottom-2 left-3 ${michroma.className}`}>Essence Radio 002</h1>
           <div className="absolute w-64 h-72 right-0 top-0 overflow-hidden rounded-bl-4xl">
             <img src="assets/elivagar.webp" alt="Essence Radio 001" className='w-full h-full object-cover' />
           </div>
           <img src="assets/elivagar-logo.png" alt="Essence Radio 001" className='w-20 h-20 object-cover ml-6 mt-1 sepia' />
       </div>
    </div>
  )
}


export default SoundCloudPoster