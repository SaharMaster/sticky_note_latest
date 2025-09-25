/**
 * Demo "hello" menu builder (schema only)
 */
export function buildHelloMenu() {
    return [
      { type: "action", label: "Regular parameter", command: "demo.param" },
      { type: "toggle", label: "Enabled/disabled parameter" },
      {
        type: "submenu",
        label: "Submenu parameter",
        items: [
          { type: "action", label: "Parameter", command: "demo.param" },
          { type: "action", label: "Parameter", command: "demo.param" },
          { type: "action", label: "Parameter", command: "demo.param" },
        ],
      },
      { type: "separator" },
    ];
  }