import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "@/components/layout/header";
import { stocksApi } from "@/lib/api";

const pushMock = jest.fn();
const usePathnameMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => usePathnameMock(),
}));

jest.mock("next/link", () => {
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

jest.mock("@/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}));

jest.mock("@/lib/api", () => ({
  stocksApi: { search: jest.fn() },
}));

beforeEach(() => {
  pushMock.mockClear();
  usePathnameMock.mockReturnValue("/screener");
  (stocksApi.search as jest.Mock).mockResolvedValue([
    { symbol: "GARAN", name: "Garanti Bankasi", type: "stock" },
  ]);
});

test("renders navigation and highlights active route", () => {
  render(<Header />);

  expect(screen.getByText("Screener")).toHaveClass("text-foreground");
  expect(screen.getByText("Portfolio")).toHaveClass("text-foreground/60");
  expect(screen.getByText("Scanner")).toHaveClass("text-foreground/60");
});

test("search shows results and navigates on selection", async () => {
  const user = userEvent.setup();
  render(<Header />);

  const input = screen.getByPlaceholderText("Hisse ara...");
  await user.type(input, "ga");

  const result = await screen.findByText("GARAN");
  await user.click(result);

  expect(pushMock).toHaveBeenCalledWith("/stock/GARAN");
});

test("shows empty state when no results", async () => {
  (stocksApi.search as jest.Mock).mockResolvedValueOnce([]);
  const user = userEvent.setup();
  render(<Header />);

  const input = screen.getByPlaceholderText("Hisse ara...");
  await user.type(input, "zz");

  expect(await screen.findByText("Sonuç bulunamadı")).toBeInTheDocument();
});
