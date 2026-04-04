import { render } from "preact";
import { App } from "./app";
import { initPortalBridge } from "./lib/portalBridge";
import "./styles/global.css";

initPortalBridge();
render(<App />, document.getElementById("app"));
