import { T } from "../lib/theme.js";
import { Card } from "../components/Common.jsx";

export default function GenericView({ data }) {
  return (
    <Card>
      <pre style={{ color: T.text, fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0, lineHeight: 1.6 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </Card>
  );
}
