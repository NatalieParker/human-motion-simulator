import { render } from "preact";
import { SandboxPage } from "./pages/Sandbox";
import { initPortalBridge } from "./lib/portalBridge";
import "./styles/global.css";

initPortalBridge();
render(<SandboxPage />, document.getElementById("app"));
