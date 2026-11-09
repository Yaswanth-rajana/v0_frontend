'use client'
import React, { useEffect, useState } from "react";
import stl from "./Tournament.module.scss";
import { useRouter } from "next/navigation";
import { TournamentFixtures } from "@/components/fixtures";
import { Standings } from "@/components/standings";
import { apiCall } from "@/store/utils";
import { endpoints } from "@/store/urls";
import { Details } from "@/components/details";
import { Header } from "@/components/header";
import { MatchTable } from "@/components/matchTable";
import toast from "react-hot-toast";

const TournamentScreen = ({ id }) => {
  const [activeTab, setActiveTab] = useState("fixtures");
  const [tournamentDetails, setTournamentDetails] = useState(null);
  const [totalRounds, setTotalRounds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMatches: 0,
    ongoingMatches: 0,
    completedMatches: 0,
    pendingMatches: 0,
    numberOfRounds: 0
  });

  const router = useRouter();

  const renderContent = () => {
    if (loading) {
      return <div className={stl.loading}>Loading tournament details...</div>;
    }

    if (!tournamentDetails) {
      return <div className={stl.error}>Tournament not found</div>;
    }

    switch (activeTab) {
      case "fixtures":
        return <TournamentFixtures tournamentId={id} totalRounds={totalRounds} tournamentType={tournamentDetails?.type} />;
      case "standings":
        return <Standings tournamentId={id} totalRounds={totalRounds} />;
      case "table":
        return <MatchTable tournamentId={id} />;
      case "details":
        return (
          <div className={stl.detailsWrapper}>
            <Details 
              tournament_id={id} 
              hideCheckin={true}
            />
          </div>
        );
      case "stats":
        return (
          <div className={stl.statsContainer}>
            <div className={stl.statCard}>
              <h3>Total Matches</h3>
              <p>{stats.totalMatches}</p>
            </div>
            <div className={stl.statCard}>
              <h3>Ongoing Matches</h3>
              <p>{stats.ongoingMatches}</p>
            </div>
            <div className={stl.statCard}>
              <h3>Completed Matches</h3>
              <p>{stats.completedMatches}</p>
            </div>
            <div className={stl.statCard}>
              <h3>Pending Matches</h3>
              <p>{stats.pendingMatches}</p>
            </div>
            <div className={stl.statCard}>
              <h3>Number of Rounds</h3>
              <p>{stats.numberOfRounds}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getTournamentDetails = async (tournament_id) => {
    try {
      setLoading(true);
      const url = endpoints.getTournamentDetails + `/${tournament_id}`;
      const data = await apiCall(url);
      
      if (!data) {
        toast.error("Tournament not found");
        router.push('/');
        return;
      }

      setTournamentDetails(data);
      if (data?.teams?.length == 32) setTotalRounds(5);
      else if (data?.teams?.length == 16) setTotalRounds(4);
      else if (data?.teams?.length == 8) setTotalRounds(3);
      else setTotalRounds(4);

      await getMatchStats(tournament_id);
    } catch (error) {
      console.warn("Failed to fetch details:", error.message || error);
      toast.error("Failed to load tournament details");
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const getMatchStats = async (tournament_id) => {
    try {
      const response = await apiCall(endpoints.getFixtures, {
        params: { tournament_id }
      });

      if (response && response.matches) {
        const matches = response.matches;
        const rounds = new Set(matches.map(match => match.round_id));

        setStats({
          totalMatches: matches.length,
          ongoingMatches: matches.filter(match => match.match_status?.status === 'on-going').length,
          completedMatches: matches.filter(match => match.match_status?.status === 'completed').length,
          pendingMatches: matches.filter(match => match.match_status?.status === 'pending').length,
          numberOfRounds: rounds.size
        });
      }
    } catch (error) {
      console.warn("Failed to fetch match stats:", error.message || error);
      toast.error("Failed to load match statistics");
    }
  };

  useEffect(() => {
    if (!id) {
      router.push('/');
      return;
    }
    
    getTournamentDetails(id);
  }, [id, router]);

  const parseTournamentName = (fullName) => {
    if (!fullName) return { name: '', location: '', format: '' };
    
    const parts = fullName.split('~');
    return {
      name: parts[0]?.trim() || '',
      location: parts[1]?.trim() || '',
      format: parts[2]?.trim() || ''
    };
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className={stl.screen}>
        <Header />
        <div className={stl.loading}>Loading tournament details...</div>
      </div>
    );
  }

  if (!tournamentDetails) {
    return (
      <div className={stl.screen}>
        <Header />
        <div className={stl.error}>
          <h2>Tournament Not Found</h2>
          <p>The tournament you're looking for could not be found.</p>
          <button onClick={handleBackToHome} className={stl.backButton}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={stl.screen}>
      <Header />
      <div className={stl.tournamentInfo}>
        <span>
          <strong>{parseTournamentName(tournamentDetails.name).name}</strong>
          {' • '}
          <span>{parseTournamentName(tournamentDetails.name).location}</span>
          {' • '}
          <span>{parseTournamentName(tournamentDetails.name).format}</span>
          {' • '}
          <span>ID: {tournamentDetails.tournament_id}</span>
          {' • '}
          <span>{tournamentDetails.type}</span>
        </span>
      </div>
      <div className={stl.tabs}>
        <button
          className={activeTab === "fixtures" ? stl.activeTab : ""}
          onClick={() => setActiveTab("fixtures")}
        >
          Fixtures
        </button>
        <button
          className={activeTab === "standings" ? stl.activeTab : ""}
          onClick={() => setActiveTab("standings")}
        >
          Standings
        </button>
        <button
          className={activeTab === "table" ? stl.activeTab : ""}
          onClick={() => setActiveTab("table")}
        >
          Table
        </button>
        <button
          className={activeTab === "stats" ? stl.activeTab : ""}
          onClick={() => setActiveTab("stats")}
        >
          Stats
        </button>
        <button
          className={activeTab === "details" ? stl.activeTab : ""}
          onClick={() => setActiveTab("details")}
        >
          Details
        </button>
      </div>
      <div className={stl.content}>
        {renderContent()}
      </div>
    </div>
  );
};

export default TournamentScreen;
