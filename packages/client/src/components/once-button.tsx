import { useState } from "react";

import { Button } from "./ui/button";

function SingleClickButton({ onClick, ...props }: React.ComponentProps<typeof Button>) {
  const [disabled, setDisabled] = useState(false);

  return (
    <Button
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        setDisabled(true);
        return onClick?.(e);
      }}
      {...props}
    />
  );
}

export { SingleClickButton };
