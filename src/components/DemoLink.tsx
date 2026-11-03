import HeaderLink from './HeaderLink';

/**
 * Demo component embedded from `using-mdx.mdx`.
 * Event handlers must be defined inside a client component —
 * functions cannot cross the island (serialization) boundary.
 */
export default function DemoLink() {
	return (
		<HeaderLink href="#" onClick={() => alert('clicked!')}>
			Embedded component in MDX
		</HeaderLink>
	);
}
