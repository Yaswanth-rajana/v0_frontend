'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { apiCall } from '@/store/utils';
import { endpoints } from '@/store/urls';
import { useRouter } from 'next/navigation';
import { Tabs, Tab, Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { 
  Stars as StarIcon, 
  LocalActivity as TicketIcon, 
  LocationOn as LocationIcon, 
  SportsHandball as ModeIcon,
  YouTube as VideoIcon,
  Image as ImageIcon,
  SportsSoccer as TournamentIcon,
  EmojiEvents as LeaderboardIcon
} from '@mui/icons-material';
import Snowfall from 'react-snowfall';
import styles from './SuperTournament.module.scss';
import Image from 'next/image';

const parseTournamentName = (fullName) => {
  const [title, location, mode] = fullName.split('~');
  return { title, location, mode };
};

const VideoCard = ({ video }) => {
  const [isInView, setIsInView] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const videoRef = useRef();

  const handleIntersection = useCallback((entries) => {
    const [entry] = entries;
    setIsInView(entry.isIntersecting);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: '100px'
    });

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, [handleIntersection]);

  return (
    <Card className={styles.videoCard} ref={videoRef}>
      <div className={styles.videoWrapper}>
        {isInView ? (
          <iframe
            width="100%"
            height="315"
            src={`https://www.youtube.com/embed/${video.id}`}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className={styles.thumbnailWrapper}>
            {!thumbnailError ? (
              <img
                src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                alt={video.title}
                onError={() => setThumbnailError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <img
                src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                alt={video.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            <div className={styles.playButton}>
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path fill="#fff" d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}
      </div>
      <CardContent>
        <Typography variant="h6" className={styles.videoTitle}>{video.title}</Typography>
      </CardContent>
    </Card>
  );
};

const SuperTournamentScreen = ({ id }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [superTournament, setSuperTournament] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [seasonImages, setSeasonImages] = useState({});
  const seasonRefs = useRef({});

  // Updated video list
  const videos = [
    { id: 'WqRqiyCZydI', title: 'Battle Under Lights | SportsAlgo PickleBall Coverage | Winter Season | 11th Dec 24\' | Court1 Game1' },
    { id: 'n158vPbQufI', title: 'Akshit/Tshering vs Vihan/Arman | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: 'lcc8XCyPqZs', title: 'Kanwar/Shrey vs Vihan/Arman | Battle Under Lights | SportsAlgo PickleBall Coverage | Winter Season' },
    { id: 'ISjjTBH_-Oc', title: 'Somil/Aditya v Md. Akhtar/Vishal | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: '7BQuXKLwqE0', title: 'Ishaan/Adhiraj vs Sidharth/Himanshika Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: 'DPKewtPRHZo', title: 'Anant/Anirudh vs Praveen/Karan | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: '4Jhx7vLV8ZU', title: 'Harsh/Rishi vs Sidharth/Himanshika | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: 'x3JVc7x-gnQ', title: 'Kanwar/Shrey vs Abhinav/Anish | Battle Under Lights | SportsAlgo PickleBall Coverage | Winter Season' },
    { id: 'L9-JeJeTZdI', title: 'Namit/Harshit vs Ishaan/Adhiraj | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: 'SgT0_cr9wRg', title: 'Adhiraj/Ishaan vs Aseem/Rajat | Battle Under Lights | SportsAlgo PickleBall Coverage | Winter Season' },
    { id: 'IQc-vbN4i4A', title: 'Rookie/Marx vs Vihaan/Arman Battle Under Lights | SportsAlgo PickleBall Coverage | Winter Season' },
    { id: 'HcqP3iDsjhQ', title: 'Rohan/Shyam vs Somil/Aditya | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: 'Agu51cGZ5AU', title: 'Vipul/Apoorv vs Praveen/Karan | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: '7dZw1LXqInw', title: 'Marx/Rookie vs Akshit/Tshering | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: 'xMKLUovXJws', title: 'Vipul/Apoorv vs Anant/Anirudh | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: 'xWZliV9nwnk', title: 'Akshit/Tshering vs Abhinav/Anish | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: 'KpL8-4Zjuzc', title: 'Harsh/Rishi vs Aseem/Rajat | Battle Under Lights | SportsAlgo PickleBall Coverage | Winter Season' },
    { id: 'SbT7DNOTSVk', title: 'Rohan/Shyam vs Md. Akhtar/Vishal | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: '6RPMNqeSZbM', title: 'Sidharth/Himanshika v Rajat/Aseem | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: 'GogiUd-jmAA', title: 'Jas/Henson vs Rohan/Shyam | Battle Under Lights | SportsAlgo PickleBall Coverage | Winter Season' },
    { id: 'e55G79JcncY', title: 'Namit/Harishit v Rishi/Harsh | Battle Under Lights | SportsAlgo PickleBall Coverage | Winter Season' },
    { id: '6AFpCGYwr6w', title: 'Vikram/Satyakam v Anirudh/Anant | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: '7IXbg84CoTs', title: 'Sidharth/Himanshika vs Namit/Harshit | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: 'g2DeKosjr50', title: 'Jas/Henson vs Somil/Aditya | Battle Under Lights | SportsAlgo PickleBall Coverage | Winter Season' },
    { id: 'h9oc4FeAKxY', title: 'Rajat/Aseem vs Namit/Harshit | Battle Under Lights | SportsAlgo Coverage | Winter Season 24\'' },
    { id: '2nxDExGl8AE', title: 'Vikram/Satyakam vs Praveen/Karan | Battle Under Lights | SportsAlgo Coverage | Winter Season |' },
    { id: 'irYP_j13HSQ', title: 'Henson/Jas vs Vishal/Akhtar | Battle Under Lights | SportsAlgo PickleBall Coverage | Winter Season' },
    { id: 'q19363Oh-80', title: 'Kanwar/Shrey vs Marx/Rookie | Battle Under Lights | SportsAlgo PickleBall Coverage | Winter Season' },
    { id: 'EtQDYojOrWc', title: 'Anish/Abhinav v Marx/Rookie | Battle Under Lights | SportsAlgo PickleBall Coverage | Winter Season' },
    { id: '1JbRGgEEORs', title: 'Vikram/Satyakam vs Vipul/Apoorv | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: 'Xo6ZtXAZZcA', title: '3rd Place Playoff | Namit/Harshit vs Vikram/Satyakam | Battle Under Lights | SportsAlgo Coverage' },
    { id: 'CQV21bfYnY8', title: 'Semi Final 2 | Vikram/satyakam vs Anirudh/Anant | Battle Under Lights | SportsAlgo Coverage' },
    { id: 'MALYN07SWpU', title: 'Semi Final 1 | Namit/Harshit vs Vipul/Apoorv | Battle Under Lights | SportsAlgo Coverage' },
    { id: '1BCgl0ThpJg', title: 'QF1 - Jas/Henson vs Vikram/Satyakam | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: '3cURfftd4HY', title: 'QF2 - Vipul/Apoorv vs Kanwar/Shrey | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: 'tFnQ9FP-ATU', title: 'Pre Quarters | Anirudh/Anant vs Sidharth/Himanshika | Battle Under Lights |' },
    { id: 'P55n7Q4YiD8', title: 'Pre Quarter - Kanwar/Shrey vs Vishal/Akhtar | Battle Under Lights | SportsAlgo Coverage' },
    { id: 'V8OJICEQDJM', title: 'Sidharth/Himanshika vs Harsh/Rishi | Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: 'UKFT6dmiMFY', title: 'QF4 | Akshit/Tshering vs Anirudh/Anant| Battle Under Lights | SportsAlgo Coverage | Winter Season' },
    { id: '9R-stN2JHns', title: 'QF 3 | Namit/Harshit vs Anish/Abhinav | Battle Under Lights | SportsAlgo Coverage' },
    { id: '_2BbV8FLye4', title: 'Pre Quarters | Vikram/Satyakam vs Harsh/Rishi | Battle Under Lights | SportsAlgo Coverage' },
    { id: 'eBQRvjAERls', title: 'Pre Quarters - Anish/Abhinav vs Somil/Aditya | Battle Under Lights | SportsAlgo Coverage' },
    { id: 'Ay-h0Lo7goY', title: 'Finals | Anirudh/Anant vs Vipul/Apoorv | Battle Under Lights | SportsAlgo Coverage | Winter Season' }
  ];

  useEffect(() => {
    const fetchSuperTournament = async () => {
      try {
        setLoading(true);
        const response = await apiCall(endpoints.getSuperTournament + '/' + id);
        setSuperTournament(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSuperTournament();
    }
  }, [id]);

  useEffect(() => {
    // Load images for each season
    const loadSeasonImages = async () => {
      try {
        const response = await fetch('/api/images');
        const data = await response.json();
        
        if (data.error) {
          console.error('Error loading images:', data.error);
          return;
        }

        setSeasonImages(data.images);
      } catch (error) {
        console.error('Error loading images:', error);
      }
    };
    
    loadSeasonImages();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const scrollToSeason = (seasonId) => {
    setActiveTab(2); // Switch to Photos tab
    setTimeout(() => {
      if (seasonRefs.current[seasonId]) {
        seasonRefs.current[seasonId].scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100); // Small delay to ensure tab switch is complete
  };

  const tabs = [
    { value: 0, label: 'Tournaments', icon: <TournamentIcon className={styles.tabIcon} /> },
    { value: 1, label: 'Videos', icon: <VideoIcon className={styles.tabIcon} /> },
    { value: 2, label: 'Photos', icon: <ImageIcon className={styles.tabIcon} /> },
    { value: 3, label: 'Leaderboard', icon: <LeaderboardIcon className={styles.tabIcon} /> }
  ];

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.superTournamentScreen}>
      <Snowfall
        style={{
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          zIndex: 10
        }}
        snowflakeCount={100}
        radius={[0.5, 2.0]}
        speed={[0.5, 2.0]}
        wind={[-0.5, 2.0]}
      />

      <div className={styles.header}>
        <div className={styles.logoWrapper}>
          <Image
            src="/logo.png"
            alt="Khel Club Logo"
            width={60}
            height={60}
            className={styles.headerLogo}
            priority
          />
        </div>
        <Typography variant="h4" className={styles.title}>
          {superTournament?.name}
        </Typography>
        <Typography variant="subtitle1" className={styles.subtitle}>
          {superTournament?.description}
        </Typography>
      </div>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          width: '100%',
          maxWidth: '100vw',
          overflow: 'hidden'
        }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="fullWidth"
            sx={{
              width: '100%',
              '& .MuiTabs-flexContainer': {
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between'
              },
              '& .MuiTab-root': {
                color: '#666',
                minHeight: {
                  xs: '40px',
                  sm: '48px'
                },
                minWidth: {
                  xs: '25%',
                  sm: 'auto'
                },
                padding: {
                  xs: '4px',
                  sm: '12px'
                },
                fontSize: {
                  xs: '11px',
                  sm: '0.875rem'
                },
                textTransform: 'none',
                '&.Mui-selected': {
                  color: '#2ecc71'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#2ecc71'
              }
            }}
          >
            {tabs.map((tab) => (
              <Tab 
                key={tab.value}
                icon={tab.icon}
                label={tab.label}
                sx={{ 
                  display: 'flex',
                  flexDirection: {
                    xs: 'column',
                    sm: 'row'
                  },
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: {
                    xs: '2px',
                    sm: '6px'
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: {
                      xs: '1rem',
                      sm: '1.2rem'
                    },
                    margin: '0 !important'
                  },
                  '& .MuiTab-iconWrapper': {
                    margin: '0 !important'
                  }
                }}
              />
            ))}
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <div className={styles.seasonsContainer}>
            <Grid container spacing={3}>
              {superTournament?.seasons?.map((season) => (
                <Grid item xs={12} key={season.id}>
                  <Card className={styles.seasonCard}>
                    <CardContent>
                      <div className={styles.seasonTitleWrapper}>
                        <StarIcon className={styles.seasonIcon} />
                        <Typography variant="h6" className={styles.seasonTitle}>
                          {season.name}
                        </Typography>
                      </div>
                      <div className={styles.categoriesGrid}>
                        {season.tournaments?.map((tournament) => {
                          const { title, location, mode } = parseTournamentName(tournament.name);
                          return (
                            <Card
                              key={tournament.id}
                              className={styles.categoryCard}
                              onClick={() => router.push(`/tournament/${tournament.id}`)}
                            >
                              <CardContent>
                                <Typography variant="h6" className={styles.tournamentTitle}>
                                  {title}
                                </Typography>
                                <div className={styles.tournamentDetails}>
                                  <div className={styles.detailItem}>
                                    <LocationIcon className={styles.detailIcon} />
                                    <Typography variant="body2">
                                      {location}
                                    </Typography>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <ModeIcon className={styles.detailIcon} />
                                    <Typography variant="body2">
                                      {mode}
                                    </Typography>
                                  </div>
                                </div>
                                <div className={styles.categoryActions}>
                                  <button 
                                    className={styles.viewWinnersButton}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      scrollToSeason(season.id);
                                    }}
                                  >
                                    View Winners
                                  </button>
                                  <button onClick={() => router.push(`/tournament/${tournament.id}`)}>
                                    View Details
                                  </button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </div>
        )}

        {activeTab === 1 && (
          <div className={styles.videosContainer}>
            <Grid container spacing={3}>
              {videos.map((video) => (
                <Grid item xs={12} md={6} lg={4} key={video.id}>
                  <VideoCard video={video} />
                </Grid>
              ))}
            </Grid>
          </div>
        )}

        {activeTab === 2 && (
          <div className={styles.imagesContainer}>
            {Object.entries(seasonImages).map(([season, images]) => {
              if (season === 'leaderboard') return null;
              if (!Array.isArray(images) || images.length === 0) return null;

              return (
                <div 
                  key={season} 
                  className={styles.seasonSection}
                  ref={el => seasonRefs.current[season] = el}
                >
                  <Typography variant="h5" gutterBottom>
                    Season {season.replace('s', '')}
                  </Typography>
                  <Grid container spacing={2}>
                    {images.map((image, index) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                        <Card className={styles.imageCard}>
                          <CardContent>
                            <img
                              src={`/bul/images/${season}/${image}`}
                              alt={`Season ${season} image ${index + 1}`}
                              className={styles.image}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 3 && (
          <div className={styles.leaderboardContainer}>
            {/* Featured 9:16 images */}
            {seasonImages.leaderboard?.featured?.length > 0 && (
              <div className={styles.featuredLeaderboard}>
                <Grid container spacing={2}>
                  {seasonImages.leaderboard.featured.map((image, index) => (
                    <Grid item xs={12} sm={4} key={index}>
                      <div className={styles.featuredImageCard}>
                        <img
                          src={`/bul/leaderboard/${image}`}
                          alt={`Leaderboard ${index + 1}`}
                          className={styles.featuredImage}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    </Grid>
                  ))}
                </Grid>
              </div>
            )}

            {/* Gallery images */}
            {seasonImages.leaderboard?.gallery?.length > 0 && (
              <div className={styles.leaderboardGallery}>
                <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                  Gallery
                </Typography>
                <Grid container spacing={2}>
                  {seasonImages.leaderboard.gallery.map((image, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                      <div className={styles.galleryImageCard}>
                        <img
                          src={`/bul/leaderboard/${image}`}
                          alt={`Gallery image ${index + 1}`}
                          className={styles.galleryImage}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    </Grid>
                  ))}
                </Grid>
              </div>
            )}
          </div>
        )}

        {/* Add powered by section at the bottom */}
        <div className={styles.poweredBySection}>
          <Typography variant="h6" className={styles.poweredByTitle}>
            Powered By:
          </Typography>
          <div className={styles.poweredByLogos}>
            <Image src="/powered-by/1.jpg" alt="Partner 1" width={120} height={60} className={styles.partnerLogo} />
            <Image src="/powered-by/2.jpg" alt="Partner 2" width={120} height={60} className={styles.partnerLogo} />
            <Image src="/powered-by/3.jpg" alt="Partner 3" width={120} height={60} className={styles.partnerLogo} />
            <Image src="/powered-by/4.jpg" alt="Partner 4" width={120} height={60} className={styles.partnerLogo} />
            <Image src="/powered-by/5.jpg" alt="Partner 5" width={120} height={60} className={styles.partnerLogo} />
          </div>
        </div>
      </Box>
    </div>
  );
};

export default SuperTournamentScreen; 