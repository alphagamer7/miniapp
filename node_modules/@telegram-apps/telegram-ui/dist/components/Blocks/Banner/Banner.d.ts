import { HTMLAttributes, MouseEventHandler, ReactNode } from 'react';
export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
    /** Specifies the banner's layout style, which can affect its positioning and styling. */
    type?: 'section' | 'inline';
    /** Element(s) to be placed on the left side of the banner, typically an icon or an image. */
    before?: ReactNode;
    /** The main text or title displayed in the banner. */
    header?: ReactNode;
    /** Additional information or subtext displayed below the header. */
    subheader?: ReactNode;
    /** Further details or description provided under the subheader. */
    description?: ReactNode;
    /** Custom background component or design, such as an image or gradient, that covers the banner's area. */
    background?: ReactNode;
    /** Callback function that is executed when the close icon of the banner is clicked. If not provided, the close icon is not displayed. */
    onCloseIcon?: MouseEventHandler<HTMLButtonElement>;
    /** Content or components, such as buttons, displayed within the banner. For multiple elements, wrap them in a React.Fragment. */
    children?: ReactNode;
}
/**
 * The `Banner` component renders a small numeric or dot indicator, typically used for notifications, statuses, or counts.
 * It supports several visual modes for different contexts (e.g., critical, primary) and can be sized normally or enlarged.
 */
export declare const Banner: ({ type, before, header, subheader, description, background, className, children, onCloseIcon, ...restProps }: BannerProps) => JSX.Element;
//# sourceMappingURL=Banner.d.ts.map