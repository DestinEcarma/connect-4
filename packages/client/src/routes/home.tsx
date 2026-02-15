import { useNavigate } from "react-router-dom";

import { Globe, User, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";

function Home() {
  const navigate = useNavigate();

  return (
    <>
      <div className="absolute top-1/2 left-1/2 flex w-sm -translate-1/2 flex-col gap-4">
        <Button disabled={true} size="lg" variant="outline" className="justify-start text-lg">
          <User className="ml-8 size-6" /> Player vs player
        </Button>
        <Button disabled={true} size="lg" variant="outline" className="justify-start text-lg">
          <UsersRound className="ml-8 size-6" /> Play with a friend
        </Button>
        <Button size="lg" className="h-fit justify-start text-lg" onClick={() => navigate("/queue")}>
          <Globe className="ml-8 size-6" />
          <div className="flex flex-col text-left leading-none">
            Play online <span className="text-sm">with a random player</span>
          </div>
        </Button>
      </div>
    </>
  );
}

export default Home;
