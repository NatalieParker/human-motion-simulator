import { render } from "preact";
import { HomePage } from "./pages/Home";
import { initPortalBridge } from "./lib/portalBridge";
import "./styles/global.css";

initPortalBridge();
render(<HomePage />, document.getElementById("app"));
