import { SuperTournamentScreen } from "@/screen/superTournament";

const SuperTournamentPage = async ({ params }) => {
  const { id } = await params;
  return <SuperTournamentScreen id={id} />;
};

export default SuperTournamentPage;
