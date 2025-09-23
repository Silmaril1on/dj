"use client"
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectUser } from '@/app/features/userSlice'
import SectionContainer from '@/app/components/containers/SectionContainer'
import FlexBox from '@/app/components/containers/FlexBox'
import Spinner from '@/app/components/ui/Spinner'
import SliderContainer from '@/app/components/containers/SliderContainer'
import ArtistCard from './ArtistCard'

const ArtistsSection = () => {
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const user = useSelector(selectUser)

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const query = user?.id ? `?userId=${encodeURIComponent(user.id)}` : "";
        const response = await fetch(`/api/artists${query}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch artists");
        }
        setArtists(data.artists || []);
      } catch (err) {
        console.error("Error fetching artists:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, [user?.id]);

  if (loading) {
    return (
      <SectionContainer title="Artists" description="Browse our artists">
        <Spinner />
      </SectionContainer>
    )
  }

  if (error) {
    return (
      <SectionContainer title="Artists" description="Browse our artists" className="bg-stone-900">
        <FlexBox type="center-col" className="py-20">
          <p className="text-red-500">Error loading artists: {error}</p>
        </FlexBox>
      </SectionContainer>
    )
  }

  return (
    <SectionContainer title="Artists" description="Browse our artists">
      <SliderContainer items={artists} animate={true}>
        {artists?.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </SliderContainer>
    </SectionContainer>
  )
}

export default ArtistsSection