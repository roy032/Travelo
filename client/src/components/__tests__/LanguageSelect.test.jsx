import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../../context/LanguageContext";
import { STORAGE_KEY } from "../../i18n";
import LanguageSelect from "../ui/LanguageSelect";
import LoginPage from "../../pages/LoginPage";
import { AuthContext } from "../../context/auth-context";
import { makeAuth } from "../../test/utils";

const renderLogin = () =>
  render(
    <AuthContext.Provider value={makeAuth()}>
      <LanguageProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </LanguageProvider>
    </AuthContext.Provider>
  );

describe("LanguageSelect", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "en";
  });

  it("switches the page to Spanish and remembers the choice", async () => {
    const user = userEvent.setup();
    renderLogin();
    expect(
      screen.getByRole("heading", { name: "Sign in to your account" })
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Language"), "es");

    expect(
      screen.getByRole("heading", { name: "Inicia sesión en tu cuenta" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByLabelText("Idioma")).toHaveValue("es");
    expect(document.documentElement.lang).toBe("es");
    expect(document.title).toBe("Iniciar sesión | Travelo");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("es");
  });

  it("shows validation errors in the chosen language", async () => {
    localStorage.setItem(STORAGE_KEY, "es");
    const { container } = renderLogin();

    fireEvent.submit(container.querySelector("form"));

    expect(await screen.findByText("El correo es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("La contraseña es obligatoria")).toBeInTheDocument();
  });

  it("names each option in its own language", () => {
    render(
      <LanguageProvider>
        <LanguageSelect />
      </LanguageProvider>
    );
    const spanish = screen.getByRole("option", { name: "Español" });
    expect(spanish).toHaveAttribute("lang", "es");
    expect(screen.getByRole("option", { name: "English" })).toHaveAttribute("lang", "en");
  });
});
