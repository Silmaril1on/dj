'use client'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeEvaluationModal, setArtistData, setLoading, setError } from '@/app/features/evaluationSlice'
import { selectEvaluationModal, selectSelectedArtist, selectArtistData, selectEvaluationLoading, selectEvaluationError } from '@/app/features/evaluationSlice'
import { truncateBio } from '@/app/helpers/utils'
import { MdPerson, MdLocationOn, MdCalendarToday, MdMusicNote, MdTransgender, MdBusiness } from 'react-icons/md'
import Button from '@/app/components/buttons/Button'
import Close from '../buttons/Close'
import Spinner from '../ui/Spinner'
import SocialLinks from './SocialLinks'
import Image from 'next/image'
import ArtistGenres from './ArtistGenres'
import Paragraph from '../ui/Paragraph'
import ArtistCountry from './ArtistCountry'

const ViewSubmittedInfo = () => {
  const dispatch = useDispatch()
  const isOpen = useSelector(selectEvaluationModal)
  const selectedArtist = useSelector(selectSelectedArtist)
  const artistData = useSelector(selectArtistData)
  const loading = useSelector(selectEvaluationLoading)
  const error = useSelector(selectEvaluationError)

  // Determine entity type; fall back to heuristics for backward compatibility
  const entityType = selectedArtist?.__type || (selectedArtist?.capacity !== undefined ? 'club' : selectedArtist?.tracklist !== undefined ? 'album' : 'artist')
  const isClub = entityType === 'club'
  const isEvent = entityType === 'event'
  const isAlbum = entityType === 'album'

  useEffect(() => {
    if (selectedArtist?.id && !artistData) {
      if (isClub || isEvent || isAlbum) {
        dispatch(setArtistData(selectedArtist))
      } else {
        fetchArtistData()
      }
    }
  }, [selectedArtist])

  const fetchArtistData = async () => {
    dispatch(setLoading(true))
    try {
      const response = await fetch(`/api/artists/artist-profile?id=${selectedArtist.id}`)
      const data = await response.json()

      if (response.ok) {
        dispatch(setArtistData(data.artist))
      } else {
        dispatch(setError(data.error || 'Failed to fetch artist data'))
      }
    } catch (err) {
      dispatch(setError('Network error while fetching artist data'))
    }
  }

  const handleClose = () => {
    dispatch(closeEvaluationModal())
  }

  if (!isOpen) return null

  return (
    <div>
      <Close className="absolute top-4 right-4 z-10" onClick={handleClose} />
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button text="Retry" onClick={fetchArtistData} />
        </div>
      )}

      {artistData && (
        <div className="space-y-2 center flex-col">
          <div className="flex gap-5 items-center justify-center w-full *:w-full">
            <div className="relative w-64 h-64 overflow-hidden">
              <Image
                src={isAlbum ? artistData.album_image : artistData.artist_image}
                alt={artistData.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gold mb-2">
                  {isClub ? 'Club Information' : isEvent ? 'Event Information' : isAlbum ? 'Album Information' : 'Basic Information'}
                </h3>
                <div className="space-y-2">
                  {isAlbum ? (
                    // Album-specific fields
                    <>
                      <div className="flex items-center gap-2">
                        <MdMusicNote className="text-gold/70" />
                        <span className="text-sm text-chino/80">Album Name:</span>
                        <span className="text-chino font-medium uppercase">{artistData.name}</span>
                      </div>
                      {artistData.release_date && (
                        <div className="flex items-center gap-2">
                          <MdCalendarToday className="text-gold/70" />
                          <span className="text-sm text-chino/80">Release Date:</span>
                          <span className="text-chino font-medium">{new Date(artistData.release_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {artistData.tracklist && artistData.tracklist.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MdMusicNote className="text-gold/70" />
                            <span className="text-sm text-chino/80">Tracks:</span>
                            <span className="text-chino font-medium">{artistData.tracklist.length}</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : isClub ? (
                    // Club-specific fields
                    <>
                      <div className="flex items-center gap-2">
                        <MdBusiness className="text-gold/70" />
                        <span className="text-sm text-chino/80">Club Name:</span>
                        <span className="text-chino font-medium uppercase">{artistData.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArtistCountry artistCountry={{country: artistData.country, city:artistData.city}} />
                      </div>
                      {artistData.capacity && (
                        <div className="flex items-center gap-2">
                          <MdPerson className="text-gold/70" />
                          <span className="text-sm text-chino/80">Capacity:</span>
                          <span className="text-chino font-medium">{artistData.capacity}</span>
                        </div>
                      )}
                    </>
                  ) : isEvent ? (
                    // Event-specific fields
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-chino/80">Event Name:</span>
                        <span className="text-chino font-medium uppercase">{artistData.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-chino/80">Promoter:</span>
                        <span className="text-chino font-medium">{artistData.stage_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArtistCountry artistCountry={{country: artistData.country, city:artistData.city}} />
                      </div>
                    </>
                  ) : (
                    // Artist-specific fields
                    <>
                      <div className="flex items-center gap-2">
                        <MdPerson className="text-gold/70" />
                        <span className="text-sm text-chino/80">Name:</span>
                        <span className="text-chino font-medium uppercase">{artistData.name}</span>
                      </div>
                      {artistData.stage_name && (
                        <div className="flex items-center gap-2">
                          <MdMusicNote className="text-gold/70" />
                          <span className="text-sm text-chino/80">Stage Name:</span>
                          <span className="text-chino font-medium">{artistData.stage_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <ArtistCountry artistCountry={{country: artistData.country, city:artistData.city}} />
                      </div>
                      {artistData.sex && (
                        <div className="flex items-center gap-2">
                          <MdTransgender className="text-gold/70" />
                          <span className="text-sm text-chino/80">Gender:</span>
                          <span className="text-chino font-medium capitalize">{artistData.sex}</span>
                        </div>
                      )}
                      {artistData.birth && (
                        <div className="flex items-center gap-2">
                          <MdCalendarToday className="text-gold/70" />
                          <span className="text-sm text-chino/80">Birth Date:</span>
                          <span className="text-chino font-medium">{artistData.birth}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              {!isClub && !isAlbum && artistData.genres && artistData.genres.length > 0 && (
                <ArtistGenres className="text-[10px]" genres={artistData.genres} />
              )}
              {!isAlbum && (
                <SocialLinks
                  social_links={artistData.social_links}
                  showTitle={true}
                  animation={false}
                />
              )}
            </div>
          </div>
          <div className=' w-[600px]'>
            {artistData.description && (
              <div>
                <h4 className="text-md font-semibold text-gold mb-2">Description</h4>
                <Paragraph text={artistData.description} />
              </div>
            )}
            {artistData.desc && (
              <div>
                <h4 className="text-md font-semibold text-gold mb-2">Description</h4>
                <Paragraph text={artistData.desc} />
              </div>
            )}
            {!isClub && !isAlbum && artistData.bio && (
              <div>
                <h4 className="text-md font-semibold text-gold mb-2">Bio</h4>
                <Paragraph text={truncateBio(artistData.bio, 500)} />
              </div>
            )}
            {isAlbum && artistData.tracklist && artistData.tracklist.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gold mb-2">Tracklist</h4>
                <ul className="space-y-1">
                  {artistData.tracklist.map((track, idx) => (
                    <li key={idx} className="text-chino text-sm flex items-center gap-2">
                      <span className="text-gold/50">{idx + 1}.</span>
                      <span>{track}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewSubmittedInfo