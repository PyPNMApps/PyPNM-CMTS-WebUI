// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RequestJsonAction } from "@/components/common/RequestJsonAction";

describe("RequestJsonAction", () => {
  it("renders a disabled JSON button until the operation completes", () => {
    const onClick = vi.fn();

    render(<RequestJsonAction disabled onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Download JSON" });
    expect(button.hasAttribute("disabled")).toBe(true);

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("calls the shared handler when JSON export is available", () => {
    const onClick = vi.fn();

    cleanup();
    render(<RequestJsonAction disabled={false} onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
