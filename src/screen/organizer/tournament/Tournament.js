'use client'
import React, { useEffect, useState } from "react";
import stl from "./Tournament.module.scss";
import { useRouter } from "next/navigation";
import { TournamentFixtures } from "@/components/fixtures";
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { Standings } from "@/components/standings";
import { apiCall } from "@/store/utils";
import { endpoints } from "@/store/urls";
import { Details } from "@/components/details";
import { Header } from "@/components/header";
import { useFormik } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object({
    tournamentId: Yup.string().required("Tournament ID is required"),
    seasonId: Yup.string().required("Season is required"),
    categoryId: Yup.string().required("Category is required"),
});

const OrganizerTournamentScreen = () => {
    const [activeTab, setActiveTab] = useState("fixtures");
    const [storedCategoryId, setStoredCategoryId] = useState(null);
    const [tournamentDetails, setTournamentDetails] = useState(null);
    const [totalRounds, setTotalRounds] = useState(0);
    const [showTournamentInput, setShowTournamentInput] = useState(false);
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [stats, setStats] = useState({
        totalMatches: 0,
        ongoingMatches: 0,
        completedMatches: 0,
        pendingMatches: 0,
        numberOfRounds: 0
    });

    const router = useRouter();

    const formik = useFormik({
        initialValues: {
            tournamentId: "",
            seasonId: "",
            categoryId: ""
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                const url = endpoints.getTournamentDetails + `/${values.categoryId}`;
                const data = await apiCall(url);
                setTournamentDetails(data);
                if (data?.teams?.length == 32) setTotalRounds(5)
                else if (data?.teams?.length == 16) setTotalRounds(4)
                else if (data?.teams?.length == 8) setTotalRounds(3)
                else setTotalRounds(4)

                sessionStorage.setItem("organizerTournamentId", values.categoryId);
                setStoredCategoryId(values.categoryId);
                setShowTournamentInput(false);
            } catch (error) {
                console.error("Failed to fetch details:", error.message);
            }
        }
    });

    const fetchTournamentDetails = async (id) => {
        try {
            setLoading(true);
            const response = await apiCall(`${endpoints.getSuperTournamentDetails}/${id}`);
            setTournament(response || null);
            // Clear season and category selection when tournament changes
            formik.setFieldValue('seasonId', '');
            formik.setFieldValue('categoryId', '');
        } catch (error) {
            console.error('Error fetching tournament details:', error);
            toast.error('Failed to fetch tournament details');
            setTournament(null);
            formik.setFieldValue('seasonId', '');
            formik.setFieldValue('categoryId', '');
        } finally {
            setLoading(false);
        }
    };

    // Handle tournament ID input change with debounce
    const handleTournamentChange = (e) => {
        const id = e.target.value.trim();
        formik.handleChange(e);

        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        if (id) {
            const newTimeout = setTimeout(() => {
                fetchTournamentDetails(id);
            }, 500);
            setTypingTimeout(newTimeout);
        } else {
            setTournament(null);
            formik.setFieldValue('seasonId', '');
            formik.setFieldValue('categoryId', '');
        }
    };

    // Get categories for selected season
    const getCategories = () => {
        const season = tournament?.seasons?.find(s => s.id.toString() === formik.values.seasonId);
        return season?.tournaments || [];
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
            console.error("Failed to fetch match stats:", error);
        }
    };

    const handleChangeTournament = () => {
        setShowTournamentInput(true);
        formik.resetForm();
    };

    useEffect(() => {
        const savedTournamentId = sessionStorage.getItem("organizerTournamentId");
        if (savedTournamentId) {
            setStoredCategoryId(savedTournamentId);
        } else {
            setShowTournamentInput(true);
        }
    }, []);

    useEffect(() => {
        if (storedCategoryId) {
            const url = endpoints.getTournamentDetails + `/${storedCategoryId}`;
            apiCall(url).then(data => {
                setTournamentDetails(data);
                if (data?.teams?.length == 32) setTotalRounds(5)
                else if (data?.teams?.length == 16) setTotalRounds(4)
                else if (data?.teams?.length == 8) setTotalRounds(3)
                else setTotalRounds(4)
            }).catch(error => {
                console.error("Failed to fetch details:", error.message);
            });
            getMatchStats(storedCategoryId);
        }
    }, [storedCategoryId]);

    const renderContent = () => {
        switch (activeTab) {
            case "fixtures":
                return <TournamentFixtures tournamentId={storedCategoryId} totalRounds={totalRounds} tournamentType={tournamentDetails?.type} />
            case "standings":
                return <Standings tournamentId={storedCategoryId} totalRounds={totalRounds} />
            case "details":
                return <Details tournament_id={storedCategoryId} checkin />
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

    return (
        <div className={stl.screen}>
            {showTournamentInput ? (
                // Tournament input form view
                <div className={stl.tournamentInputContainer}>
                    <h2>Tournament Selection</h2>
                    <form onSubmit={formik.handleSubmit} className={stl.form}>
                        <div className={stl.formGroup}>
                            <label htmlFor="tournamentId">Tournament ID: </label>
                            <input
                                id="tournamentId"
                                name="tournamentId"
                                type="text"
                                placeholder="Enter Tournament ID"
                                onChange={handleTournamentChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.tournamentId}
                                className={stl.input}
                            />
                            {formik.touched.tournamentId && formik.errors.tournamentId && (
                                <div className={stl.error}>{formik.errors.tournamentId}</div>
                            )}
                        </div>

                        {loading && <div className={stl.loading}>Loading...</div>}

                        {tournament && (
                            <div className={stl.tournamentInfo}>
                                <p><strong>Tournament Name:</strong> {tournament.name}</p>
                                <p><strong>Description:</strong> {tournament.description}</p>
                            </div>
                        )}

                        <div className={stl.formGroup}>
                            <label htmlFor="seasonId">Season: </label>
                            <select
                                id="seasonId"
                                name="seasonId"
                                onChange={(e) => {
                                    formik.handleChange(e);
                                    formik.setFieldValue('categoryId', '');
                                }}
                                onBlur={formik.handleBlur}
                                value={formik.values.seasonId}
                                className={stl.input}
                                disabled={!tournament || loading}
                            >
                                <option value="">Select Season</option>
                                {tournament?.seasons?.map(season => (
                                    <option key={season.id} value={season.id}>
                                        {season.name}
                                    </option>
                                ))}
                            </select>
                            {formik.touched.seasonId && formik.errors.seasonId && (
                                <div className={stl.error}>{formik.errors.seasonId}</div>
                            )}
                        </div>

                        <div className={stl.formGroup}>
                            <label htmlFor="categoryId">Category: </label>
                            <select
                                id="categoryId"
                                name="categoryId"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.categoryId}
                                className={stl.input}
                                disabled={!formik.values.seasonId}
                            >
                                <option value="">Select Category</option>
                                {getCategories().map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name.split('~')[0]}
                                    </option>
                                ))}
                            </select>
                            {formik.touched.categoryId && formik.errors.categoryId && (
                                <div className={stl.error}>{formik.errors.categoryId}</div>
                            )}
                        </div>

                        <div className={stl.buttonGroup}>
                            <button type="submit" className={stl.submitButton} disabled={loading}>
                                Submit
                            </button>
                            <button
                                type="button"
                                className={stl.backButton}
                                onClick={() => router.push("/organizer/match-ops")}
                            >
                                Back to Match Ops
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                // Main tournament view
                <>
                    {storedCategoryId ? (
                        <div className={stl.mainContent}>
                            <button
                                className={stl.changeTournamentButton}
                                onClick={handleChangeTournament}
                            >
                                Change Tournament
                            </button>
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
                    ) : (
                        <div className={stl.invalidTournament}>
                            <button onClick={() => router.push("/organizer/match-ops")}>
                                <HomeOutlinedIcon style={{ color: 'white' }} />
                            </button>
                            <h1>Invalid Tournament ID</h1>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default OrganizerTournamentScreen; 