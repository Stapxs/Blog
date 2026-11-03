interface Props {
	date: Date | string;
}

export default function FormattedDate({ date }: Props) {
	const value = typeof date === 'string' ? new Date(date) : date;

	return (
		<time dateTime={value.toISOString()}>
			{value.toLocaleDateString('en-us', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			})}
		</time>
	);
}
