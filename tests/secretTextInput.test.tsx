// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecretTextInput } from "@/components/common/SecretTextInput";

describe("SecretTextInput", () => {
  it("hides the value by default and reveals it on toggle", () => {
    render(<SecretTextInput aria-label="Community" defaultValue="private" />);

    const input = screen.getByLabelText("Community");
    expect(input.getAttribute("type")).toBe("password");

    fireEvent.click(screen.getByRole("button", { name: "Show value" }));
    expect(input.getAttribute("type")).toBe("text");

    fireEvent.click(screen.getByRole("button", { name: "Hide value" }));
    expect(input.getAttribute("type")).toBe("password");
  });
});
