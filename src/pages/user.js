import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./user.css";
import { useNavigate } from 'react-router-dom';

const User = () => {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicData, setMusicData] = useState([]);
  const [progress, setProgress] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);
  const navigate = useNavigate();
  const [currentIndex1, setCurrentIndex1] = useState(0);
  const [currentIndex2, setCurrentIndex2] = useState(0);
  const [currentIndex3, setCurrentIndex3] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [popularSongs, setPopularSongs] = useState([]);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [username, setUsername] = useState('');
  const [currentIndexPopular, setCurrentIndexPopular] = useState(0);
  const [currentIndexTrending, setCurrentIndexTrending] = useState(0);
  const [currentIndexFavorites, setCurrentIndexFavorites] = useState(0);
  const [currentIndexPlaylists, setCurrentIndexPlaylists] = useState(0);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const [isPlaylistSongsModalOpen, setIsPlaylistSongsModalOpen] = useState(false);
  const [selectedPlaylistForPlaying, setSelectedPlaylistForPlaying] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState(null);
  const audioRef = useRef(null);

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        console.log('API URL:', apiUrl);
        const response = await fetch(`${apiUrl}/api/music1`); 
        
        const data = await response.json();
        const allMusic = [...data.data];
        const sortedByPlayCount = allMusic.sort((a, b) => {
          const countA = parseInt(a.play_count) || 0;
          const countB = parseInt(b.play_count) || 0;
          return countB - countA;
        });
        const popularSongs = sortedByPlayCount.slice(0, 6);
        const trendingSongs = sortedByPlayCount.slice(6);
        setMusicData(allMusic);
        setPopularSongs(popularSongs);
        setTrendingSongs(trendingSongs);
      } catch (error) {
        console.error("Error fetching music:", error);
      }
    };
    fetchMusic();
  }, [apiUrl]);

  const addToFavorites = async (song) => {
    try {
      const isProcessing = favorites.some(fav => fav.isProcessing);
      if (isProcessing) return;
      const existingFavorite = favorites.find(fav => fav.music.id === song.id);

      if (existingFavorite) {
        setFavorites(prev => prev.filter(fav => fav.id !== existingFavorite.id));
        const response = await fetch(`${apiUrl}/api/favorites/${existingFavorite.documentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`
          }
        });

        if (!response.ok) {
          setFavorites(prev => [...prev, existingFavorite]);
          throw new Error('Failed to remove favorite');
        }
        await fetchFavorites();
      } else {
        const tempFavorite = {
          id: `temp-${Date.now()}`,
          music: song,
          isProcessing: true
        };
        setFavorites(prev => [...prev, tempFavorite]);
        const response = await fetch('${apiUrl}/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`
          },
          body: JSON.stringify({
            data: {
              users_permissions_users: [localStorage.getItem('userId')],
              music: song.id,
              AddedAt: new Date().toISOString(),
              locale: 'en'
            }
          })
        });

        if (!response.ok) {
          setFavorites(prev => prev.filter(fav => fav.id !== tempFavorite.id));
          throw new Error('Failed to add favorite');
        }
        await fetchFavorites();
      }
    } catch (error) {
      console.error('Error in addToFavorites:', error);
    }
  };

  const addToPlaylist = (song) => {
    setSelectedSongForPlaylist(song);
    setIsPlaylistModalOpen(true);
  };

  const createNewPlaylist = async () => {
    if (newPlaylistName.trim() && selectedSongForPlaylist) {
      try {
        const response = await fetch('${apiUrl}/api/play-lists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`
          },
          body: JSON.stringify({
            data: {
              users_permissions_user: localStorage.getItem('userId'),
              ListName: newPlaylistName,
              music: [selectedSongForPlaylist.id],
            }
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to create playlist');
        }

        const userId = localStorage.getItem('userId');
        const getResponse = await fetch(
          `${apiUrl}/api/play-lists?filters[users_permissions_user][id][$eq]=${userId}&populate[music][populate]=*`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
          }
        );

        if (!getResponse.ok) {
          throw new Error('Failed to fetch playlists');
        }

        const data = await getResponse.json();
        setPlaylists(data.data || []);

        setNewPlaylistName('');
        setIsPlaylistModalOpen(false);
        setSelectedSongForPlaylist(null);

      } catch (error) {
        console.error('Error creating playlist:', error);
      }
    }
  };

  const deleteEmptyPlaylist = async (playlistId) => {
    try {
      const response = await fetch(`${apiUrl}/api/play-lists/${playlistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete playlist');
      }

      setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
      
      const userId = localStorage.getItem('userId');
      const getResponse = await fetch(
        `${apiUrl}/api/play-lists?filters[users_permissions_user][id][$eq]=${userId}&populate[music][populate]=*`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`
          }
        }
      );

      if (!getResponse.ok) {
        throw new Error('Failed to fetch updated playlists');
      }

      const data = await getResponse.json();
      setPlaylists(data.data || []);

    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const addSongToPlaylist = async (playlist) => {
    try {
      const playlistId = playlist.id;
      const currentSongs = playlist.music?.map(song => song.id) || [];
      
      const songIndex = currentSongs.indexOf(selectedSongForPlaylist.id);
      let updatedSongs;
      
      if (songIndex !== -1) {
        updatedSongs = currentSongs.filter(id => id !== selectedSongForPlaylist.id);
      } else {
        updatedSongs = [...currentSongs, selectedSongForPlaylist.id];
      }

      if (updatedSongs.length === 0) {
        await deleteEmptyPlaylist(playlist.documentId);
        setIsPlaylistModalOpen(false);
        setSelectedSongForPlaylist(null);
        return;
      }
      
      const updateResponse = await fetch(`${apiUrl}/api/play-lists/${playlist.documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify({
          data: {
            users_permissions_user: localStorage.getItem('userId'),
            ListName: playlist.ListName,
            music: [...currentSongs, selectedSongForPlaylist.id]
          }
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update playlist');
      }

      const userId = localStorage.getItem('userId');
      const getResponse = await fetch(
        `${apiUrl}/api/play-lists?filters[users_permissions_user][id][$eq]=${userId}&populate[music][populate]=*`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`
          }
        }
      );

      if (!getResponse.ok) {
        throw new Error('Failed to fetch updated playlists');
      }

      const data = await getResponse.json();
      setPlaylists(data.data || []);

      setIsPlaylistModalOpen(false);
      setSelectedSongForPlaylist(null);

    } catch (error) {
      console.error('Error updating playlist:', error);
    }
  };

  const handleNext1 = () => {
    if (currentIndex1 + 2 < popularSongs.length) {
      setCurrentIndex1(prev => prev + 1);
    }
  };

  const handlePrev1 = () => {
    setCurrentIndex1(prev => Math.max(0, prev - 1));
  };

  const visiblePopularSongs = useMemo(() => {
    return popularSongs.slice(currentIndexPopular, currentIndexPopular + 2);
  }, [popularSongs, currentIndexPopular]);

  const visibleTrendingSongs = useMemo(() => {
    return trendingSongs.slice(currentIndexTrending, currentIndexTrending + 2);
  }, [trendingSongs, currentIndexTrending]);

  const handleMusicPlay = useCallback(async (song, playlist = null, playlistIndex = 0) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Eğer playlist belirtildiyse, playlist bilgilerini kaydet
    if (playlist) {
      setCurrentPlaylist(playlist);
      setCurrentPlaylistIndex(playlistIndex);
    } else {
      // Playlist yoksa bu değerleri sıfırla
      setCurrentPlaylist(null);
      setCurrentPlaylistIndex(0);
    }

    if (currentSong && currentSong.id === song.id) {
      if (audioRef.current.paused) {
        try {
          await audioRef.current.play();
          setIsMusicPlaying(true);
        } catch (error) {
          console.error("Playback failed:", error);
        }
      } else {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      }
      return;
    }

    try {
      audioRef.current.pause();
      setIsMusicPlaying(false);
      audioRef.current.src = "${apiUrl}" + song.SourceUrl;
      
      try {
        const response = await fetch(`${apiUrl}/api/music1/${song.documentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              play_count: (parseInt(song.play_count || 0) + 1)
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error Details:", errorData);
          throw new Error(`Failed to update play count: ${errorData.error?.message || 'Unknown error'}`);
        }

        const updatedData = await response.json();

      } catch (error) {
        console.error("Error updating play count:", error);
      }
      
      await audioRef.current.load();
      await audioRef.current.play();
      
      setIsMusicPlaying(true);
      setCurrentSong(song);
      setProgress(0);
    } catch (error) {
      console.error("Error playing new song:", error);
    }
  }, [currentSong, apiUrl]);

  useEffect(() => {
    const audioElement = audioRef.current;

    const updateProgress = () => {
      setProgress(audioElement.currentTime);
    };

    const handleSongEnd = () => {
      setProgress(0);
      setIsMusicPlaying(false);

      if (currentPlaylist) {
        const playlistSongs = currentPlaylist.music || [];
        const nextIndex = currentPlaylistIndex + 1;

        if (nextIndex < playlistSongs.length) {
          const nextSong = playlistSongs[nextIndex];
          handleMusicPlay(nextSong, currentPlaylist, nextIndex);
        } else {
          setCurrentPlaylist(null);
          setCurrentPlaylistIndex(0);
        }
      }
    };

    audioElement.addEventListener("timeupdate", updateProgress);
    audioElement.addEventListener("ended", handleSongEnd);

    return () => {
      audioElement.removeEventListener("timeupdate", updateProgress);
      audioElement.removeEventListener("ended", handleSongEnd);
    };
  }, [currentPlaylist, currentPlaylistIndex, handleMusicPlay]);

  const visibleFavorites = useMemo(() => {
    return favorites.slice(currentIndexFavorites, currentIndexFavorites + 2);
  }, [favorites, currentIndexFavorites]);

  const visiblePlaylists = useMemo(() => {
    return playlists.slice(currentIndexPlaylists, currentIndexPlaylists + 2);
  }, [playlists, currentIndexPlaylists]);

  const handleNext2 = () => {
    if (currentIndex2 + 2 < trendingSongs.length) {
      setCurrentIndex2(prev => prev + 1);
    }
  };

  const handlePrev2 = () => {
    setCurrentIndex2(prev => Math.max(0, prev - 1));
  };

  const handleNext3 = () => {
    if (currentIndex3 + 2 < playlists.length) {
      setCurrentIndex3(prev => prev + 1);
    }
  };

  const handlePrev3 = () => {
    setCurrentIndex3(prev => Math.max(0, prev - 1));
  };

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await fetch('${apiUrl}/api/users/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`
          }
        });
        const data = await response.json();
        setUsername(data.username);
      } catch (error) {
        console.error('Error fetching username:', error);
      }
    };

    fetchUsername();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim()) {
      const results = musicData.filter(song => 
        song.Title.toLowerCase().includes(term.toLowerCase()) ||
        song.Artist.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    navigate('/');
  };

  const fetchFavorites = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(
        `${apiUrl}/api/favorites?filters[users_permissions_users][id][$eq]=${userId}&populate=*`, 
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`
          }
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        setFavorites(data.data || []);
      } else {
        console.error('Failed to fetch favorites');
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handlePopularPrev = () => setCurrentIndexPopular(prev => Math.max(0, prev - 1));
  const handlePopularNext = () => {
    if (currentIndexPopular + 2 < popularSongs.length) {
      setCurrentIndexPopular(prev => prev + 1);
    }
  };

  const handleTrendingPrev = () => setCurrentIndexTrending(prev => Math.max(0, prev - 1));
  const handleTrendingNext = () => {
    if (currentIndexTrending + 2 < trendingSongs.length) {
      setCurrentIndexTrending(prev => prev + 1);
    }
  };

  const handleFavoritesPrev = () => setCurrentIndexFavorites(prev => Math.max(0, prev - 1));
  const handleFavoritesNext = () => {
    if (currentIndexFavorites + 2 < favorites.length) {
      setCurrentIndexFavorites(prev => prev + 1);
    }
  };

  const handlePlaylistsPrev = () => setCurrentIndexPlaylists(prev => Math.max(0, prev - 1));
  const handlePlaylistsNext = () => {
    if (currentIndexPlaylists + 2 < playlists.length) {
      setCurrentIndexPlaylists(prev => prev + 1);
    }
  };

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const response = await fetch(
          `${apiUrl}/api/play-lists?filters[users_permissions_user][id][$eq]=${userId}&populate[music][populate]=*`, 
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
          }
        );
        
        const data = await response.json();
        if (response.ok) {
          setPlaylists(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching playlists:', error);
      }
    };
    fetchPlaylists();
  }, [apiUrl]);

  const playNextSong = useCallback(() => {
    if (currentPlaylist) {
      const playlistSongs = currentPlaylist.music || [];
      const nextIndex = currentPlaylistIndex + 1;
      
      if (nextIndex < playlistSongs.length) {
        handleMusicPlay(playlistSongs[nextIndex], currentPlaylist, nextIndex);
      }
    } else {
      const currentSongIndex = musicData.findIndex(song => song.id === currentSong?.id);
      if (currentSongIndex !== -1 && currentSongIndex + 1 < musicData.length) {
        handleMusicPlay(musicData[currentSongIndex + 1]);
      }
    }
  }, [currentPlaylist, currentPlaylistIndex, currentSong, musicData, handleMusicPlay]);

  const playPreviousSong = useCallback(() => {
    if (currentPlaylist) {
      const playlistSongs = currentPlaylist.music || [];
      const prevIndex = currentPlaylistIndex - 1;
      
      if (prevIndex >= 0) {
        handleMusicPlay(playlistSongs[prevIndex], currentPlaylist, prevIndex);
      }
    } else {
      const currentSongIndex = musicData.findIndex(song => song.id === currentSong?.id);
      if (currentSongIndex > 0) {
        handleMusicPlay(musicData[currentSongIndex - 1]);
      }
    }
  }, [currentPlaylist, currentPlaylistIndex, currentSong, musicData, handleMusicPlay]);

  const handlePlaylistClick = (playlist) => {
    setSelectedPlaylistForPlaying(playlist);
    setIsPlaylistSongsModalOpen(true);
  };

     
  const handleDeletePlaylist = async (playlistId) => {
    try {
      const response = await fetch(`${apiUrl}/api/play-lists/${playlistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete playlist');
      }

      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      setShowDeleteConfirmation(false);
      setPlaylistToDelete(null);
      setIsPlaylistSongsModalOpen(false);

    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const handlePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, []);

  return (
    <div className="user-container">
      <div className="user-main-content">
        <div className="user-header">
          <div className="user-search-container">
            <input
              type="text"
              className="user-search-bar"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
            />
            {showSearchResults && searchTerm && (
              <div className="user-search-results">
                {searchResults.map(song => (
                  <div 
                    key={song.id} 
                    className="user-search-result-item"
                    onClick={() => {
                      handleMusicPlay(song);
                      setShowSearchResults(false);
                      setSearchTerm('');
                    }}
                  >
                    <img 
                      src={`https://img.youtube.com/vi/${song.SourceYoutube}/default.jpg`} 
                      alt={song.Title}
                    />
                    <div>
                      <h4>{song.Title}</h4>
                      <p>{song.Artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="user-profile">
            <span className="user-name">Welcome, {username}</span>
            <button onClick={handleLogout} className="user-logout-btn">
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>

        <section className="user-sections">
          {/* Popular ve Trending Songs */}
          <div className="user-main-sections">
            {/* Popular Songs */}
            <div className="user-section">
              <div className="user-section-header">
                <h2>Popular Songs</h2>
                <div className="user-slider-controls">
                  <button className="user-slider-btn prev" onClick={handlePopularPrev}>&lt;</button>
                  <button className="user-slider-btn next" onClick={handlePopularNext}>&gt;</button>
                </div>
              </div>
              <div className="user-slider-container">
                <div className="user-slider">
                  {visiblePopularSongs.map((song) => (
                    <div key={song.id} className="user-card">
                      <div className="user-thumbnail-container">
                        <img
                          src={`https://img.youtube.com/vi/${song.SourceYoutube}/maxresdefault.jpg`}
                          alt={`${song.Title} thumbnail`}
                        />
                        <div className="user-card-overlay">
                          <button onClick={() => addToFavorites(song)} className="user-favorite-btn">
                            <i className="fas fa-heart"></i>
                          </button>
                          <button onClick={() => handleMusicPlay(song)} className="user-play-btn">
                            <i className="fas fa-play"></i>
                          </button>
                          <button onClick={() => addToPlaylist(song)} className="user-playlist-btn">
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                      </div>
                      <div className="user-card-info">
                        <h4>{song.Title}</h4>
                        <p>{song.Artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="user-section">
              <div className="user-section-header">
                <h2>Trending Songs</h2>
                <div className="user-slider-controls">
                  <button className="user-slider-btn prev" onClick={handleTrendingPrev}>&lt;</button>
                  <button className="user-slider-btn next" onClick={handleTrendingNext}>&gt;</button>
                </div>
              </div>
              <div className="user-slider-container">
                <div className="user-slider">
                  {visibleTrendingSongs.map((song) => (
                    <div key={song.id} className="user-card">
                      <div className="user-thumbnail-container">
                        <img
                          src={`https://img.youtube.com/vi/${song.SourceYoutube}/maxresdefault.jpg`}
                          alt={`${song.Title} thumbnail`}
                        />
                        <div className="user-card-overlay">
                          <button onClick={() => addToFavorites(song)} className="user-favorite-btn">
                            <i className="fas fa-heart"></i>
                          </button>
                          <button onClick={() => handleMusicPlay(song)} className="user-play-btn">
                            <i className="fas fa-play"></i>
                          </button>
                          <button onClick={() => addToPlaylist(song)} className="user-playlist-btn">
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                      </div>
                      <div className="user-card-info">
                        <h4>{song.Title}</h4>
                        <p>{song.Artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="user-secondary-sections">
            {/* Favoriler */}
            <div className="user-section">
              <div className="user-section-header">
                <h2>Favorites</h2>
                <div className="user-slider-controls">
                  <button className="user-slider-btn prev" onClick={handleFavoritesPrev}>&lt;</button>
                  <button className="user-slider-btn next" onClick={handleFavoritesNext}>&gt;</button>
                </div>
              </div>
              <div className="user-slider-container">
                <div className="user-slider">
                  {favorites.length === 0 ? (
                    <div className="user-empty-favorites">
                      <i className="fas fa-heart"></i>
                      <p>You can add favorites by clicking the heart icon</p>
                    </div>
                  ) : (
                    visibleFavorites.map((favorite) => (
                      <div key={favorite.id} className="user-card">
                        <div className="user-thumbnail-container">
                          <img
                            src={`https://img.youtube.com/vi/${favorite.music.SourceYoutube}/maxresdefault.jpg`}
                            alt={`${favorite.music.Title} thumbnail`}
                          />
                          <div className="user-card-overlay">
                            <button onClick={() => handleMusicPlay(favorite.music)} className="user-play-btn">
                              <i className="fas fa-play"></i>
                            </button>
                            <button onClick={() => addToPlaylist(favorite.music)} className="user-playlist-btn">
                              <i className="fas fa-plus"></i>
                            </button>
                          </div>
                        </div>
                        <div className="user-card-info">
                          <h4>{favorite.music.Title}</h4>
                          <p>{favorite.music.Artist}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="user-section">
              <div className="user-section-header">
                <h2>Playlists</h2>
                <div className="user-slider-controls">
                  <button className="user-slider-btn prev" onClick={handlePlaylistsPrev}>&lt;</button>
                  <button className="user-slider-btn next" onClick={handlePlaylistsNext}>&gt;</button>
                </div>
              </div>
              <div className="user-slider-container">
                <div className="user-slider">
                  {playlists.length === 0 ? (
                    <div className="user-empty-playlist">
                      <i className="fas fa-music"></i>
                      <p>Create your first playlist by clicking the + icon on any song</p>
                    </div>
                  ) : (
                    visiblePlaylists.map((playlist) => {
                      // Playlist içindeki şarkı sayısını doğru şekilde hesapla
                      const musicCount = playlist.music?.length || 0;
                      // İlk şarkıyı al (varsa)
                      const firstSong = playlist.music?.[0];

                      return (
                        <div key={playlist.id} className="user-card" onClick={() => handlePlaylistClick(playlist)}>
                          <div className="user-thumbnail-container playlist-thumbnail">
                            <div className="playlist-cover">
                              <i className="fas fa-music"></i>
                              <span>{musicCount} songs</span>
                            </div>
                            <div className="user-card-overlay">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation(); // Card'a tıklamayı engelle
                                  if (musicCount > 0 && firstSong) {
                                    handleMusicPlay(firstSong, playlist, 0);
                                  }
                                }} 
                                className="user-play-btn"
                                disabled={musicCount === 0}
                              >
                                <i className="fas fa-play"></i>
                              </button>
                            </div>
                          </div>
                          <div className="user-card-info">
                            <h4>{playlist.ListName}</h4>
                            <p>{musicCount} tracks</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {(isMusicPlaying || progress > 0) && (
          <div className="music-bar">
            {currentSong && (
              <div className="music-info">
                <img
                  src={`https://img.youtube.com/vi/${currentSong.SourceYoutube}/maxresdefault.jpg`}
                  alt="Song thumbnail"
                />
                <div className="song-details">
                  <h4>{currentSong.Title}</h4>
                  <p>{currentSong.Artist}</p>
                </div>
              </div>
            )}
            <div className="audio-controls">
              <button 
                onClick={playPreviousSong} 
                className="control-btn"
                disabled={
                  currentPlaylist 
                    ? currentPlaylistIndex === 0 
                    : musicData.findIndex(song => song.id === currentSong?.id) === 0
                }
              >
                <i className="fa-solid fa-backward"></i>
              </button>
              <button 
                onClick={() => audioRef.current.currentTime -= 10} 
                className="control-btn"
              >
                <i className="fa-solid fa-rotate-left"></i>
              </button>
              <button
                onClick={() => {
                  if (isMusicPlaying) {
                    audioRef.current.pause();
                    setIsMusicPlaying(false);
                  } else {
                    audioRef.current.play();
                    setIsMusicPlaying(true);
                  }
                }}
                className="control-btn play-btn"
              >
                {isMusicPlaying ? 
                  <i className="fa-solid fa-pause"></i> : 
                  <i className="fa-solid fa-play"></i>
                }
              </button>
              <button 
                onClick={() => audioRef.current.currentTime += 10} 
                className="control-btn"
              >
                <i className="fa-solid fa-rotate-right"></i>
              </button>
              <button 
                onClick={playNextSong} 
                className="control-btn"
                disabled={
                  currentPlaylist 
                    ? currentPlaylistIndex === (currentPlaylist.music?.length || 0) - 1
                    : musicData.findIndex(song => song.id === currentSong?.id) === musicData.length - 1
                }
              >
                <i className="fa-solid fa-forward"></i>
              </button>
            </div>
            <div className="progress-container">
              <input
                type="range"
                min="0"
                max={audioRef.current.duration || 100}
                value={progress}
                onChange={(e) => audioRef.current.currentTime = e.target.value}
                className="progress-bar"
              />
            </div>
          </div>
        )}

        {isPlaylistModalOpen && (
          <div className="user-modal-overlay" onClick={() => setIsPlaylistModalOpen(false)}>
            <div className="user-modal" onClick={e => e.stopPropagation()}>
              <div className="user-modal-header">
                <h3>Add to Playlist</h3>
                <button className="user-close-btn" onClick={() => setIsPlaylistModalOpen(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="user-modal-content">
                <div className="user-selected-song">
                  <img 
                    src={`https://img.youtube.com/vi/${selectedSongForPlaylist?.SourceYoutube}/default.jpg`}
                    alt={selectedSongForPlaylist?.Title}
                  />
                  <div className="user-selected-song-info">
                    <h4>{selectedSongForPlaylist?.Title}</h4>
                    <p>{selectedSongForPlaylist?.Artist}</p>
                  </div>
                </div>
                <div className="user-new-playlist">
                  <input
                    type="text"
                    placeholder="New Playlist Name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="user-playlist-input"
                  />
                  <button 
                    onClick={createNewPlaylist} 
                    className="user-create-playlist-btn"
                    disabled={!newPlaylistName.trim()}
                  >
                    Create & Add
                  </button>
                </div>
                <div className="user-existing-playlists">
                  <h4>Or add to existing playlist:</h4>
                  {playlists.length === 0 ? (
                    <p className="user-no-playlists">No playlists yet</p>
                  ) : (
                    playlists.map(playlist => (
                      <div key={playlist.id} className="user-playlist-item">
                        <div className="user-playlist-info">
                          <span className="user-playlist-name">{playlist.ListName}</span>
                          <span className="user-playlist-count">{playlist.music?.length || 0} songs</span>
                        </div>
                        <button 
                          onClick={() => addSongToPlaylist(playlist)}
                          className="user-add-to-playlist-btn"
                        >
                          Add
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {isPlaylistSongsModalOpen && selectedPlaylistForPlaying && (
          <div className="user-modal-overlay" onClick={() => setIsPlaylistSongsModalOpen(false)}>
            <div className="user-modal" onClick={e => e.stopPropagation()}>
              <div className="user-modal-header">
                <h3>{selectedPlaylistForPlaying.ListName}</h3>
                <div className="modal-header-buttons">
                  <button 
                    className="delete-playlist-btn"
                    onClick={() => {
                      setPlaylistToDelete(selectedPlaylistForPlaying);
                      setShowDeleteConfirmation(true);
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                  <button className="user-close-btn" onClick={() => setIsPlaylistSongsModalOpen(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
              <div className="user-modal-content">
                <div className="playlist-songs-list">
                  {selectedPlaylistForPlaying.music?.map((song, index) => (
                    <div 
                      key={song.id} 
                      className="playlist-song-item"
                      onClick={() => {
                        handleMusicPlay(song, selectedPlaylistForPlaying, index);
                        setIsPlaylistSongsModalOpen(false);
                      }}
                    >
                      <div className="playlist-song-info">
                        <img 
                          src={`https://img.youtube.com/vi/${song.SourceYoutube}/default.jpg`}
                          alt={song.Title}
                        />
                        <div>
                          <h4>{song.Title}</h4>
                          <p>{song.Artist}</p>
                        </div>
                      </div>
                      <button className="playlist-song-play-btn">
                        <i className="fas fa-play"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirmation && playlistToDelete && (
          <div className="user-modal-overlay" onClick={() => setShowDeleteConfirmation(false)}>
            <div className="user-modal delete-confirmation-modal" onClick={e => e.stopPropagation()}>
              <div className="user-modal-header">
                <h3>Delete Playlist</h3>
                <button className="user-close-btn" onClick={() => setShowDeleteConfirmation(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="user-modal-content">
                <p>Are you sure you want to delete "{playlistToDelete.ListName}"?</p>
                <p className="warning-text">This action cannot be undone.</p>
                <div className="confirmation-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => setShowDeleteConfirmation(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeletePlaylist(playlistToDelete.documentId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default User;
