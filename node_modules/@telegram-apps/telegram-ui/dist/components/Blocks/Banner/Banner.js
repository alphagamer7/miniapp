'use client';
import { _ as _object_spread } from "@swc/helpers/_/_object_spread";
import { _ as _object_spread_props } from "@swc/helpers/_/_object_spread_props";
import { _ as _object_without_properties } from "@swc/helpers/_/_object_without_properties";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { classNames } from "../../../helpers/classNames";
import { hasReactNode } from "../../../helpers/react/node";
import { usePlatform } from "../../../hooks/usePlatform";
import { Icon24Cancel } from "../../../icons/24/cancel";
import { Icon28Close } from "../../../icons/28/close";
import { Icon28CloseAmbient } from "../../../icons/28/close_ambient";
import { Tappable } from "../../Service/Tappable/Tappable";
import { Subheadline } from "../../Typography/Subheadline/Subheadline";
import { Text } from "../../Typography/Text/Text";
/**
 * The `Banner` component renders a small numeric or dot indicator, typically used for notifications, statuses, or counts.
 * It supports several visual modes for different contexts (e.g., critical, primary) and can be sized normally or enlarged.
 */ export const Banner = (_param)=>{
    var { type, before, header, subheader, description, background, className, children, onCloseIcon } = _param, restProps = _object_without_properties(_param, [
        "type",
        "before",
        "header",
        "subheader",
        "description",
        "background",
        "className",
        "children",
        "onCloseIcon"
    ]);
    const platform = usePlatform();
    const hasBackground = hasReactNode(background);
    return /*#__PURE__*/ _jsxs("section", _object_spread_props(_object_spread({
        className: classNames("tgui-c3d21871b48e0ba3", platform === 'ios' && "tgui-cefdf70a2d9648ea", platform === 'base' && "tgui-7b260d7ad33f3ba0", hasBackground && "tgui-f80265c401d577b0", type === 'inline' && "tgui-d67d90bbcab86e14", className)
    }, restProps), {
        children: [
            hasBackground && /*#__PURE__*/ _jsx("div", {
                className: "tgui-11921b54915b369c",
                children: background
            }),
            before,
            /*#__PURE__*/ _jsxs("div", {
                className: "tgui-a04b768cea14d789",
                children: [
                    hasReactNode(header) && /*#__PURE__*/ _jsx(Text, {
                        className: "tgui-2646957e5c9379f3",
                        weight: "2",
                        children: header
                    }),
                    hasReactNode(subheader) && /*#__PURE__*/ _jsx(Subheadline, {
                        className: "tgui-62a759a0c54c3667",
                        level: "2",
                        children: subheader
                    }),
                    hasReactNode(description) && /*#__PURE__*/ _jsx(Subheadline, {
                        className: "tgui-1e638bcb841cdfbc",
                        level: "2",
                        children: description
                    }),
                    hasReactNode(children) && /*#__PURE__*/ _jsx("div", {
                        className: "tgui-5e0d89b3bc8342d8",
                        children: children
                    })
                ]
            }),
            onCloseIcon && /*#__PURE__*/ _jsxs(Tappable, {
                onClick: onCloseIcon,
                className: "tgui-fa2f2ea4a4ffc035",
                Component: "div",
                children: [
                    !hasBackground && (platform === 'ios' ? /*#__PURE__*/ _jsx(Icon24Cancel, {}) : /*#__PURE__*/ _jsx(Icon28Close, {})),
                    hasBackground && /*#__PURE__*/ _jsx(Icon28CloseAmbient, {})
                ]
            })
        ]
    }));
};

//# sourceMappingURL=Banner.js.map