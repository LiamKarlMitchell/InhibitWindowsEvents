/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import "virtual:uno.css";
import "./styles/globals.css";

render(() => <App />, document.getElementById("root") as HTMLElement);
