'use client';

import { useEffect } from 'react';
import DisableDevtool from 'disable-devtool';

export default function DevtoolGuard() {
  useEffect(() => {
    DisableDevtool({
      disableMenu: true,
      clearLog: true,
      detectors: [
        DisableDevtool.DetectorType.RegToString,
        DisableDevtool.DetectorType.DefineId,
        DisableDevtool.DetectorType.DateToString,
        DisableDevtool.DetectorType.FuncToString,
        DisableDevtool.DetectorType.Performance,
        DisableDevtool.DetectorType.DebugLib,
      ],
    });
  }, []);

  return null;
}

