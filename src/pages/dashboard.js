import React, { useState, useEffect, useRef, useMemo } from "react";
import "./dashboard.css";
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicData, setMusicData] = useState([]);
  const audioRef = useRef(new Audio());
  const [progress, setProgress] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);
  const navigate = useNavigate();
  const [currentIndex1, setCurrentIndex1] = useState(0);
  const [currentIndex2, setCurrentIndex2] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const apiUrl = process.env.REACT_APP_API_URL;
  const [trendingSongs, setTrendingSongs] = useState([]);
  const socket = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL);

  useEffect(() => {
    const fetchMusic = async () => {
      try {
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
        setTrendingSongs(trendingSongs); 
      } catch (error) {
        console.error("Error fetching music:", error);
      }
    };

    fetchMusic();
  }, []);

  useEffect(() => {
    const fetchTrendingSongs = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/music/trending`);
        const data = await response.json();
        setTrendingSongs(data);
      } catch (error) {
        console.error('Error fetching trending songs:', error);
      }
    };

    fetchTrendingSongs();
  }, [apiUrl]);

  const filteredMusic = useMemo(() => {
    if (selectedGenre === 'All') return musicData;
    return musicData.filter(song => song.Type === selectedGenre);
  }, [musicData, selectedGenre]);

  useEffect(() => {
    const audioElement = audioRef.current;

    const updateProgress = () => {
      setProgress(audioElement.currentTime);
    };

    const handleSongEnd = () => {
      setProgress(0);  
      setIsMusicPlaying(false);  
    };

    if (audioElement) {
      audioElement.addEventListener("timeupdate", updateProgress);
      audioElement.addEventListener("ended", handleSongEnd);
    }

    return () => {
      audioElement.removeEventListener("timeupdate", updateProgress);
      audioElement.removeEventListener("ended", handleSongEnd);
    };
  }, []);

  const handleMusicPlay = async (song) => {
    const audioElement = audioRef.current;

    if (currentSong && currentSong.id === song.id) {
      if (audioElement.paused) {
        try {
          await audioElement.play();
          setIsMusicPlaying(true);
        } catch (error) {
          console.error("Playback failed:", error);
        }
      } else {
        audioElement.pause();
        setIsMusicPlaying(false);
      }
      return;
    }

    try {
      audioElement.pause();
      setIsMusicPlaying(false);
      
      console.log('Song object:', song);
      console.log('API URL:', apiUrl);
      console.log('Source URL:', song.SourceUrl);
      
      const audioUrl = `${apiUrl}/api/${song.SourceUrl}`;
      console.log('Final audio URL:', audioUrl);
      
      audioElement.src = audioUrl;
      
      await audioElement.load();
      await audioElement.play();
      setIsMusicPlaying(true);
      setCurrentSong(song);
      setProgress(0);
    } catch (error) {
      console.error("Error playing new song:", error);
      setIsMusicPlaying(false);
    }
  };

  const handleLoginClick = () => {
    navigate('/Login');
  };

  const handleNext1 = () => {
    setCurrentIndex1((prevIndex) => (prevIndex + 2) % musicData.length);
  };

  const handlePrev1 = () => {
    setCurrentIndex1((prevIndex) => (prevIndex - 2 + musicData.length) % musicData.length);
  };

  const handleNext2 = () => {
    setCurrentIndex2((prevIndex) => (prevIndex + 2) % musicData.length);
  };

  const handlePrev2 = () => {
    setCurrentIndex2((prevIndex) => (prevIndex - 2 + musicData.length) % musicData.length);
  };

  const visibleSongs1 = musicData.slice(currentIndex1, currentIndex1 + 2);
  const visibleSongs2 = musicData.slice(currentIndex2, currentIndex2 + 2);

  const getFilteredMusic = (type) => {
    return musicData.filter(song => song.Type === type);
  };

  const genreIcons = {
    'Rap': 'fa-microphone',
    'Pop': 'fa-music',
    'Rock': 'fa-guitar',
    'Jazz': 'fa-saxophone',
    'Arabesk': 'fa-headphones'
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (term.length > 0) {
      const results = musicData.filter(song => 
        song.Title.toLowerCase().includes(term) || 
        song.Artist.toLowerCase().includes(term)
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const url = `${apiUrl}/music/search`;

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <header className="dashboard-header">
          <div className="search-container">
            <input 
              type="text" 
              className="search-bar" 
              placeholder="Search songs or artists..." 
              value={searchTerm}
              onChange={handleSearch}
            />
            {showSearchResults && (
              <div className="search-results">
                {searchResults.length > 0 ? (
                  searchResults.map((song) => (
                    <div 
                      key={song.id} 
                      className="search-result-item"
                      onClick={() => {
                        handleMusicPlay(song);
                        setShowSearchResults(false);
                        setSearchTerm('');
                      }}
                    >
                      <img 
                        src={`https://img.youtube.com/vi/${song.SourceYoutube}/maxresdefault.jpg`}
                        alt={song.Title}
                      />
                      <div className="result-info">
                        <h4>{song.Title}</h4>
                        <p>{song.Artist}</p>
                      </div>
                      <i className="fas fa-play"></i>
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    No songs found
                  </div>
                )}
              </div>
            )}
          </div>
          <button className="login-btn" onClick={handleLoginClick}>Login</button>
        </header>

        <section className="dashboard-sections">
          <div className="sections-grid">
            <div className="section">
              <div className="section-header">
                <h2>Popular</h2>
                <div className="slider-controls">
                  <button className="slider-btn prev" onClick={handlePrev1}>&lt;</button>
                  <button className="slider-btn next" onClick={handleNext1}>&gt;</button>
                </div>
              </div>
              <div className="slider-container">
                <div className="slider">
                  {visibleSongs1.map((song) => (
                    <div key={song.id} className="card">
                      <div className="thumbnail-container" onClick={() => handleMusicPlay(song)}>
                        <img
                          src={`https://img.youtube.com/vi/${song.SourceYoutube}/maxresdefault.jpg`}
                          alt={`${song.Title} thumbnail`}
                        />
                        <div className="play-overlay">
                          <i className="fas fa-play"></i>
                        </div>
                      </div>
                      <div className="card-info">
                        <h4>{song.Title}</h4>
                        <p>{song.Artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <h2>Trending Now</h2>
                <div className="slider-controls">
                  <button className="slider-btn prev" onClick={handlePrev2}>&lt;</button>
                  <button className="slider-btn next" onClick={handleNext2}>&gt;</button>
                </div>
              </div>
              <div className="slider-container">
                <div className="slider">
                  {visibleSongs2.map((song) => (
                    <div key={song.id} className="card">
                      <div className="thumbnail-container" onClick={() => handleMusicPlay(song)}>
                        <img
                          src={`https://img.youtube.com/vi/${song.SourceYoutube}/maxresdefault.jpg`}
                          alt={`${song.Title} thumbnail`}
                        />
                        <div className="play-overlay">
                          <i className="fas fa-play"></i>
                        </div>
                      </div>
                      <div className="card-info">
                        <h4>{song.Title}</h4>
                        <p>{song.Artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="genre-icons-section">
            <h2>Genres</h2>
            <div className="genre-icons">
              {[...new Set(musicData.map(song => song.Type))].map(type => (
                <div 
                  key={type} 
                  className="genre-icon"
                  onClick={() => {
                    setSelectedGenre(type);
                    setIsGenreModalOpen(true);
                  }}
                >
                  <i className={`fas ${genreIcons[type] || 'fa-music'}`}></i>
                  <span>{type}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {isGenreModalOpen && (
          <div className="genre-modal-overlay" onClick={() => setIsGenreModalOpen(false)}>
            <div className="genre-modal" onClick={e => e.stopPropagation()}>
              <div className="genre-modal-header">
                <h2>{selectedGenre}</h2>
                <button 
                  className="close-modal"
                  onClick={() => setIsGenreModalOpen(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="genre-modal-content">
                {getFilteredMusic(selectedGenre).map(song => (
                  <div key={song.id} className="genre-song-card">
                    <img 
                      src={`https://img.youtube.com/vi/${song.SourceYoutube}/maxresdefault.jpg`}
                      alt={song.Title}
                    />
                    <div className="song-info">
                      <h3>{song.Title}</h3>
                      <p>{song.Artist}</p>
                    </div>
                    <button 
                      className="play-song-btn"
                      onClick={() => handleMusicPlay(song)}
                    >
                      <i className="fas fa-play"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
};

export default Dashboard;
