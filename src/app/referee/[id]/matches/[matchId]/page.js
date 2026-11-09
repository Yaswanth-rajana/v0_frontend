import { MatchScreen } from "@/screen/referee/match";

const RefereeMatchPage = async ({ params }) => {
  const { id, matchId } = await params;
  return <MatchScreen tournamentId={id} matchId={matchId} />;
};

export default RefereeMatchPage;
