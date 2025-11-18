import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

const BackArrow = (props: SvgProps) => {
  return (
    <Svg width={70} height={70} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M15 18l-6-6 6-6"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default BackArrow;
